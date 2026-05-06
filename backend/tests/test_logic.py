import pytest
from main import build_find_command, SearchParams

def test_build_find_command_basic():
    params = SearchParams(directory=".")
    cmd = build_find_command(params, use_printf=False)
    assert cmd == ["find", "."]

def test_build_find_command_with_name():
    params = SearchParams(directory="/tmp", name="*.txt", case_insensitive=False)
    cmd = build_find_command(params, use_printf=False)
    assert "-name" in cmd
    assert "*.txt" in cmd
    assert cmd[cmd.index("-name") + 1] == "*.txt"

def test_build_find_command_case_insensitive():
    params = SearchParams(directory=".", name="test", case_insensitive=True)
    cmd = build_find_command(params, use_printf=False)
    assert "-iname" in cmd
    assert "test" in cmd

def test_build_find_command_with_type():
    params = SearchParams(directory=".", type="Fichiers (f)")
    cmd = build_find_command(params, use_printf=False)
    assert "-type" in cmd
    assert "f" in cmd

def test_build_find_command_with_size():
    params = SearchParams(directory=".", size_op="+", size_val=10, size_unit="M")
    cmd = build_find_command(params, use_printf=False)
    assert "-size" in cmd
    assert "+10M" in cmd

def test_build_find_command_with_depth():
    params = SearchParams(directory=".", min_depth=2, max_depth=5)
    cmd = build_find_command(params, use_printf=False)
    assert "-mindepth" in cmd
    assert "2" in cmd
    assert "-maxdepth" in cmd
    assert "5" in cmd

def test_build_find_command_with_prune():
    params = SearchParams(directory=".", prune_dirs="node_modules,.git")
    cmd = build_find_command(params, use_printf=False)
    assert "-prune" in cmd
    assert "node_modules" in cmd
    assert ".git" in cmd
    assert "-o" in cmd
