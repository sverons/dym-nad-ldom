#!/usr/bin/env python3
"""Проверка логики связей на доске улик (порт BoardLayout)."""

from __future__ import annotations

from collections import deque

INFORMANT_NODES = {
    "dean": "dean",
    "butterfield": "butterfield",
    "sloan": "sloan",
    "mitchell": "mitchell",
    "woods": "woods",
    "baldwin": "baldwin",
    "mccord": "mccord",
}

ADJACENCY = {
    "nixon": {"e1", "e5", "e9", "e13"},
    "dean": {"e1", "e2"},
    "butterfield": {"e2", "e3"},
    "sloan": {"e3", "e4"},
    "mitchell": {"e4", "e5"},
    "woods": {"e5", "e6"},
    "baldwin": {"e6", "e7"},
    "mccord": {"e7", "e8"},
    "e1": {"nixon", "dean", "e2", "e9"},
    "e2": {"dean", "butterfield", "e1", "e3"},
    "e3": {"butterfield", "sloan", "e2", "e4"},
    "e4": {"sloan", "mitchell", "e3", "e5"},
    "e5": {"nixon", "mitchell", "woods", "e4", "e6"},
    "e6": {"woods", "baldwin", "e5", "e7"},
    "e7": {"baldwin", "mccord", "e6", "e8"},
    "e8": {"mccord", "e7", "e9"},
    "e9": {"nixon", "e1", "e8", "e10"},
    "e10": {"e9", "e11"},
    "e11": {"e10", "e12"},
    "e12": {"e11", "e13"},
    "e13": {"nixon", "e12", "e14"},
    "e14": {"e13", "e15"},
    "e15": {"e14", "e16"},
    "e16": {"e15", "e17"},
    "e17": {"e16", "e18"},
    "e18": {"e17", "e9"},
}


def evidence_space(board, node):
    return board.get(node)


def can_traverse(board, src, dst):
    if src in INFORMANT_NODES.values():
        space = evidence_space(board, dst)
        return space and space["face_up"]
    if dst == "nixon":
        space = evidence_space(board, src)
        return space and space["face_up"]
    a = evidence_space(board, src)
    b = evidence_space(board, dst)
    return a and b and a["face_up"] and b["face_up"]


def is_connected(informant, board):
    start = INFORMANT_NODES[informant]
    visited = set()
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node == "nixon":
            return True
        if node in visited:
            continue
        visited.add(node)
        for neighbor in ADJACENCY.get(node, set()):
            if neighbor == "nixon":
                if can_traverse(board, node, "nixon"):
                    return True
                continue
            if can_traverse(board, node, neighbor) and neighbor not in visited:
                queue.append(neighbor)
    return False


def connected_count(board):
    return sum(
        1
        for informant in INFORMANT_NODES
        if board.get(INFORMANT_NODES[informant], {}).get("pinned")
        and board.get(INFORMANT_NODES[informant], {}).get("face_up")
        and is_connected(informant, board)
    )


def run_tests():
    failures = []

    # Пустая доска — нет связей
    empty = {}
    if connected_count(empty) != 0:
        failures.append("empty board should have 0 connections")

    # Один открытый путь dean -> e1 -> nixon
    board = {
        "dean": {"pinned": True, "face_up": True},
        "e1": {"face_up": True},
    }
    if not is_connected("dean", board):
        failures.append("dean-e1-nixon path should connect")

    # Лицом вниз информант не считается
    board2 = {
        "dean": {"pinned": True, "face_up": False},
        "e1": {"face_up": True},
    }
    if connected_count(board2) != 0:
        failures.append("face-down informant must not count")

    # Два независимых пути — победа редактора
    board3 = {
        "dean": {"pinned": True, "face_up": True},
        "sloan": {"pinned": True, "face_up": True},
        "e1": {"face_up": True},
        "e3": {"face_up": True},
        "e4": {"face_up": True},
        "e5": {"face_up": True},
    }
    if connected_count(board3) < 2:
        failures.append("two informants with paths should reach 2 connections")

    # Закрытая улика рвёт путь
    board4 = {
        "dean": {"pinned": True, "face_up": True},
        "e1": {"face_up": False},
    }
    if is_connected("dean", board4):
        failures.append("face-down evidence should block path")

    return failures


if __name__ == "__main__":
    fails = run_tests()
    if fails:
        print("FAILED:")
        for item in fails:
            print(" -", item)
        raise SystemExit(1)
    print("Board layout tests: OK (4 scenarios)")
