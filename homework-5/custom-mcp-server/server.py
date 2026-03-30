from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("Lorem Ipsum MCP Server")

LOREM_FILE = Path(__file__).parent / "lorem-ipsum.md"


def _get_words(word_count: int) -> str:
    text = LOREM_FILE.read_text(encoding="utf-8")
    words = text.split()
    return " ".join(words[:word_count])


@mcp.resource("lorem://ipsum{?word_count}")
def lorem_resource(word_count: int = 30) -> str:
    """
    Resource URI that reads from lorem-ipsum.md and returns exactly word_count words.

    Resources are URIs that Claude can read from (e.g., files, APIs).
    They are passive data sources — Claude fetches them like reading a URL.
    """
    return _get_words(word_count)


@mcp.tool()
def read(word_count: int = 30) -> str:
    """
    Read lorem ipsum text from lorem-ipsum.md.

    Tools are actions Claude can call to perform operations (e.g., reading a file,
    running a command). Unlike resources, tools are active — Claude invokes them
    like calling a function, and they can have side effects.

    Args:
        word_count: Number of words to return (default: 30).

    Returns:
        The first word_count words from lorem-ipsum.md.
    """
    return _get_words(word_count)


if __name__ == "__main__":
    mcp.run()
