from st_pages import Page, Section, show_pages, add_page_title

add_page_title()
show_pages(
    [
        Page("app.py", "Event Tagger", "🎦"),
        Page("pages/post_match.py", "Post Match", "⚽"),
    ]
)