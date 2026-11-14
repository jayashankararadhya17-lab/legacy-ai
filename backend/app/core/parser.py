
from tree_sitter import Language, Parser
import tree_sitter_java as tsjava

JAVA_LANGUAGE = Language(tsjava.language())

parser = Parser(JAVA_LANGUAGE)


def parse_java(source_code):

    tree = parser.parse(
        source_code.encode("utf-8")
    )

    results = []

    def traverse(node):

        if node.type in {
            "class_declaration",
            "interface_declaration",
            "method_declaration",
            "constructor_declaration"
        }:
            results.append({
                "type": node.type,
                "start_line": node.start_point.row + 1,
                "end_line": node.end_point.row + 1,
                "source": source_code.encode("utf-8")[
                    node.start_byte:node.end_byte
                ].decode("utf-8")
            })

        for child in node.children:
            traverse(child)

    traverse(tree.root_node)

    return results
