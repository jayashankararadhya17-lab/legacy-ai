
from collections import Counter


def detect_languages(files):

    counts = Counter(
        file["language"] for file in files
    )

    total = sum(counts.values())

    return {
        "total_files": total,
        "languages": [
            {
                "language": language,
                "files": count,
                "percentage": round(
                    count / total * 100, 2
                )
            }
            for language, count in counts.most_common()
        ]
    }
