import sys
import subprocess
import shlex
import os
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QLineEdit, QPushButton, QFileDialog, QComboBox, QCheckBox, 
    QSpinBox, QLabel, QTableWidget, QTableWidgetItem, QProgressBar, 
    QMessageBox, QTabWidget, QHeaderView
)
from PyQt6.QtCore import QThread, pyqtSignal, Qt

# --- Style Sombre (QSS) ---
DARK_STYLE = """
QMainWindow, QWidget {
    background-color: #2b2b2b;
    color: #e0e0e0;
    font-family: 'Segoe UI', Arial, sans-serif;
}
QTabWidget::pane {
    border: 1px solid #444;
    background-color: #333;
}
QTabBar::tab {
    background: #444;
    color: #bbb;
    padding: 10px 20px;
    border: 1px solid #222;
    border-bottom: none;
}
QTabBar::tab:selected {
    background: #555;
    color: white;
}
QLineEdit, QSpinBox, QComboBox {
    background-color: #3b3b3b;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 6px;
    color: white;
}
QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
    border: 1px solid #0d47a1;
}
QPushButton {
    background-color: #1a73e8;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
}
QPushButton:hover {
    background-color: #1557b0;
}
QPushButton:pressed {
    background-color: #0d47a1;
}
QPushButton:disabled {
    background-color: #555;
    color: #888;
}
QTableWidget {
    background-color: #1e1e1e;
    gridline-color: #333;
    color: #ccc;
    border: none;
}
QHeaderView::section {
    background-color: #333;
    color: #aaa;
    padding: 6px;
    border: 1px solid #222;
}
QProgressBar {
    border: 1px solid #444;
    border-radius: 2px;
    background-color: #333;
    height: 10px;
}
QProgressBar::chunk {
    background-color: #1a73e8;
}
"""

class FindWorker(QThread):
    """
    Worker thread pour exécuter 'find' et parser les résultats structurés.
    """
    result_ready = pyqtSignal(list)
    finished = pyqtSignal()
    error_occurred = pyqtSignal(str)

    def __init__(self, command, use_printf=True):
        super().__init__()
        self.command = command
        self.use_printf = use_printf

    def run(self):
        try:
            # Si on n'a pas d'action personnalisée, on utilise -printf pour les métadonnées
            final_cmd = self.command
            if self.use_printf:
                # Format: chemin|nom|taille|permissions
                final_cmd = self.command + ["-printf", "%p|%f|%s|%m\n"]

            process = subprocess.Popen(
                final_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            if process.stdout:
                for line in process.stdout:
                    line = line.strip()
                    if not line:
                        continue
                        
                    if self.use_printf and "|" in line:
                        parts = line.split('|')
                        if len(parts) == 4:
                            self.result_ready.emit(parts)
                    else:
                        # Cas fallback ou -exec qui affiche ses propres infos
                        self.result_ready.emit([line, os.path.basename(line), "?", "?"])

            _, stderr = process.communicate()
            if process.returncode != 0 and stderr:
                # Ignorer les erreurs de permission habituelles sur Linux
                if "Permission denied" not in stderr:
                    self.error_occurred.emit(stderr.strip())

        except Exception as e:
            self.error_occurred.emit(str(e))
        finally:
            self.finished.emit()

class FindorApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Findor Pro - GUI pour Bash 'find'")
        self.setMinimumSize(1000, 750)
        self.init_ui()
        self.setStyleSheet(DARK_STYLE)

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)

        # --- Zone Commande (Pédagogique) ---
        cmd_group = QVBoxLayout()
        cmd_label = QLabel("COMMANDE BASH GÉNÉRÉE :")
        cmd_label.setStyleSheet("font-weight: bold; color: #1a73e8; font-size: 10px;")
        cmd_group.addWidget(cmd_label)
        
        self.cmd_display = QLineEdit()
        self.cmd_display.setReadOnly(True)
        self.cmd_display.setStyleSheet("""
            background-color: #121212; 
            color: #00ff41; 
            font-family: 'Courier New', monospace; 
            font-size: 13px;
            border: 1px solid #333;
        """)
        cmd_group.addWidget(self.cmd_display)
        main_layout.addLayout(cmd_group)

        # --- Onglets de configuration ---
        self.tabs = QTabWidget()
        
        # 1. Onglet Filtres
        filter_tab = QWidget()
        f_layout = QVBoxLayout(filter_tab)
        f_layout.setSpacing(10)

        # Dossier
        dir_h = QHBoxLayout()
        self.dir_input = QLineEdit(os.getcwd())
        btn_browse = QPushButton("Parcourir")
        btn_browse.clicked.connect(self.browse_folder)
        dir_h.addWidget(QLabel("Dossier source :"))
        dir_h.addWidget(self.dir_input)
        dir_h.addWidget(btn_browse)
        f_layout.addLayout(dir_h)

        # Nom et Casse
        name_h = QHBoxLayout()
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("ex: *.py, index.*, config.json")
        self.case_check = QCheckBox("Ignorer la casse (-iname)")
        self.case_check.setChecked(True)
        name_h.addWidget(QLabel("Nom/Pattern :"))
        name_h.addWidget(self.name_input)
        name_h.addWidget(self.case_check)
        f_layout.addLayout(name_h)

        # Type, Taille, Temps
        grid_h = QHBoxLayout()
        
        # Type
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Tout", "Fichiers (f)", "Dossiers (d)", "Liens (l)"])
        grid_h.addWidget(QLabel("Type :"))
        grid_h.addWidget(self.type_combo)

        # Taille
        self.size_op = QComboBox()
        self.size_op.addItems(["+", "-"])
        self.size_val = QSpinBox()
        self.size_val.setRange(0, 999999)
        self.size_unit = QComboBox()
        self.size_unit.addItems(["k", "M", "G"])
        grid_h.addWidget(QLabel("Taille :"))
        grid_h.addWidget(self.size_op)
        grid_h.addWidget(self.size_val)
        grid_h.addWidget(self.size_unit)

        # Temps
        grid_h.addWidget(QLabel("Modifié (jours) :"))
        self.mtime_val = QSpinBox()
        self.mtime_val.setRange(-1, 3650)
        self.mtime_val.setSpecialValueText("Désactivé")
        grid_h.addWidget(self.mtime_val)
        f_layout.addLayout(grid_h)

        # Profondeur
        depth_h = QHBoxLayout()
        depth_h.addWidget(QLabel("Profondeur Min :"))
        self.min_depth = QSpinBox()
        depth_h.addWidget(self.min_depth)
        depth_h.addWidget(QLabel("Profondeur Max :"))
        self.max_depth = QSpinBox()
        self.max_depth.setRange(0, 999)
        self.max_depth.setSpecialValueText("Illimitée")
        depth_h.addWidget(self.max_depth)
        f_layout.addLayout(depth_h)

        # 2. Onglet Permissions/Propriété
        perm_tab = QWidget()
        p_layout = QVBoxLayout(perm_tab)
        p_grid = QHBoxLayout()
        
        self.perm_input = QLineEdit()
        self.perm_input.setPlaceholderText("ex: 755")
        p_grid.addWidget(QLabel("Permissions (octal) :"))
        p_grid.addWidget(self.perm_input)

        self.user_input = QLineEdit()
        self.user_input.setPlaceholderText("Nom d'utilisateur")
        p_grid.addWidget(QLabel("Utilisateur :"))
        p_grid.addWidget(self.user_input)

        self.group_input = QLineEdit()
        self.group_input.setPlaceholderText("Nom du groupe")
        p_grid.addWidget(QLabel("Groupe :"))
        p_grid.addWidget(self.group_input)
        
        p_layout.addLayout(p_grid)
        p_layout.addStretch()

        # 3. Onglet Actions (-exec)
        action_tab = QWidget()
        a_layout = QVBoxLayout(action_tab)
        a_layout.addWidget(QLabel("Action personnalisée (-exec) :"))
        self.exec_input = QLineEdit()
        self.exec_input.setPlaceholderText("ex: chmod 644, rm -rf, grep 'test'")
        a_layout.addWidget(self.exec_input)
        
        help_text = QLabel("ℹ️ L'application ajoutera automatiquement '{} \\;' à la fin.")
        help_text.setStyleSheet("color: #888; font-style: italic;")
        a_layout.addWidget(help_text)
        a_layout.addStretch()

        self.tabs.addTab(filter_tab, "🔍 Filtres principaux")
        self.tabs.addTab(perm_tab, "🔑 Permissions / Propriété")
        self.tabs.addTab(action_tab, "⚙️ Actions (-exec)")
        main_layout.addWidget(self.tabs)

        # --- Boutons d'Action ---
        btn_h = QHBoxLayout()
        self.btn_search = QPushButton("🚀 LANCER LA RECHERCHE")
        self.btn_search.clicked.connect(self.start_search)
        
        self.btn_copy = QPushButton("📋 Copier le chemin")
        self.btn_copy.clicked.connect(self.copy_path)
        
        btn_h.addWidget(self.btn_search, 2)
        btn_h.addWidget(self.btn_copy, 1)
        main_layout.addLayout(btn_h)

        # --- Tableau des résultats ---
        self.results_table = QTableWidget(0, 4)
        self.results_table.setHorizontalHeaderLabels(["Nom", "Chemin complet", "Taille (octets)", "Mode"])
        self.results_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.results_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.results_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.results_table.setAlternatingRowColors(True)
        main_layout.addWidget(self.results_table)

        # --- Barre de progression ---
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 0)
        self.progress_bar.hide()
        main_layout.addWidget(self.progress_bar)

        # Signaux de mise à jour de la commande
        self.connect_signals()
        self.update_cmd_preview()

    def connect_signals(self):
        widgets = [
            self.dir_input, self.name_input, self.case_check, self.type_combo,
            self.size_op, self.size_val, self.size_unit, self.mtime_val,
            self.min_depth, self.max_depth, self.perm_input, self.user_input,
            self.group_input, self.exec_input
        ]
        for w in widgets:
            if isinstance(w, QLineEdit): w.textChanged.connect(self.update_cmd_preview)
            elif isinstance(w, (QSpinBox, QComboBox)): w.valueChanged.connect(self.update_cmd_preview) if hasattr(w, 'valueChanged') else w.currentIndexChanged.connect(self.update_cmd_preview)
            elif isinstance(w, QCheckBox): w.toggled.connect(self.update_cmd_preview)

    def build_command(self, use_exec=True):
        directory = self.dir_input.text().strip() or "."
        cmd = ["find", directory]

        # Profondeur
        if self.min_depth.value() > 0:
            cmd.extend(["-mindepth", str(self.min_depth.value())])
        if self.max_depth.value() > 0:
            cmd.extend(["-maxdepth", str(self.max_depth.value())])

        # Nom
        pattern = self.name_input.text().strip()
        if pattern:
            flag = "-iname" if self.case_check.isChecked() else "-name"
            cmd.extend([flag, pattern])

        # Type
        t_idx = self.type_combo.currentIndex()
        types = [None, "f", "d", "l"]
        if types[t_idx]:
            cmd.extend(["-type", types[t_idx]])

        # Taille
        if self.size_val.value() > 0:
            size_str = f"{self.size_op.currentText()}{self.size_val.value()}{self.size_unit.currentText()}"
            cmd.extend(["-size", size_str])

        # Temps
        if self.mtime_val.value() >= 0:
            cmd.extend(["-mtime", str(self.mtime_val.value())])

        # Permissions / Propriété
        if self.perm_input.text().strip():
            cmd.extend(["-perm", self.perm_input.text().strip()])
        if self.user_input.text().strip():
            cmd.extend(["-user", self.user_input.text().strip()])
        if self.group_input.text().strip():
            cmd.extend(["-group", self.group_input.text().strip()])

        # Action personnalisée
        exec_val = self.exec_input.text().strip()
        if use_exec and exec_val:
            try:
                parts = shlex.split(exec_val)
                cmd.append("-exec")
                cmd.extend(parts)
                cmd.extend(["{}", ";"])
            except Exception:
                pass # Shlex error, preview handle

        return cmd

    def update_cmd_preview(self):
        cmd = self.build_command(use_exec=True)
        # On échappe les arguments pour l'affichage pédagogique
        self.cmd_display.setText(" ".join(shlex.quote(arg) for arg in cmd))

    def browse_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Sélectionner le dossier source")
        if folder:
            self.dir_input.setText(folder)

    def start_search(self):
        exec_val = self.exec_input.text().strip()
        if exec_val:
            reply = QMessageBox.warning(
                self, "⚠️ Action Critique", 
                f"Vous allez exécuter la commande suivante sur TOUS les résultats :\n\n{exec_val} {{}} ;\n\nContinuer ?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply == QMessageBox.StandardButton.No:
                return

        cmd = self.build_command(use_exec=True)
        self.results_table.setRowCount(0)
        self.btn_search.setEnabled(False)
        self.progress_bar.show()

        # On n'utilise -printf que si aucune action -exec n'est définie
        use_printf = not bool(exec_val)
        
        self.worker = FindWorker(cmd, use_printf=use_printf)
        self.worker.result_ready.connect(self.add_result_row)
        self.worker.finished.connect(self.search_finished)
        self.worker.error_occurred.connect(self.handle_error)
        self.worker.start()

    def add_result_row(self, data):
        # data format: [path, name, size, perms]
        row = self.results_table.rowCount()
        self.results_table.insertRow(row)
        
        self.results_table.setItem(row, 0, QTableWidgetItem(data[1]))
        self.results_table.setItem(row, 1, QTableWidgetItem(data[0]))
        self.results_table.setItem(row, 2, QTableWidgetItem(data[2]))
        self.results_table.setItem(row, 3, QTableWidgetItem(data[3]))

    def search_finished(self):
        self.btn_search.setEnabled(True)
        self.progress_bar.hide()
        count = self.results_table.rowCount()
        self.statusBar().showMessage(f"Recherche terminée : {count} éléments trouvés.", 5000)

    def handle_error(self, err_msg):
        QMessageBox.critical(self, "Erreur de recherche", err_msg)

    def copy_path(self):
        current_row = self.results_table.currentRow()
        if current_row >= 0:
            path = self.results_table.item(current_row, 1).text()
            QApplication.clipboard().setText(path)
            self.statusBar().showMessage("Chemin copié dans le presse-papier !", 2000)
        else:
            QMessageBox.information(self, "Copier", "Veuillez sélectionner une ligne dans le tableau.")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = FindorApp()
    window.show()
    sys.exit(app.exec())
