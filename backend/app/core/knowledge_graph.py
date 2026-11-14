
import networkx as nx


class KnowledgeGraph:

    def __init__(self):
        self.graph = nx.DiGraph()

    def add_component(self, component):
        self.graph.add_node(
            component["name"],
            type=component["type"]
        )

    def add_dependency(self, source, target):
        self.graph.add_edge(
            source,
            target
        )

    def get_relationships(self):
        return [
            {
                "source": source,
                "target": target
            }
            for source, target in self.graph.edges()
        ]

    def get_statistics(self):
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges()
        }
