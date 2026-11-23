#!/usr/bin/env python3
"""Gera HTML, catálogo, manifest e sitemap a partir dos JSON do Pages CMS."""
import html
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "content/ludo-conecta/articles"
TEMPLATE = (ROOT / "templates/ludo-article.html.tpl").read_text(encoding="utf-8")
DOMAIN = "https://universoludo.com.br"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
IMAGE = re.compile(r"^/assets/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$", re.I)
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

def esc(value):
    return html.escape(str(value if value is not None else ""), quote=True)

def safe_image(value):
    value = str(value or "").strip()
    return value if IMAGE.fullmatch(value) and ".." not in value else None

class CleanHTML(HTMLParser):
    allowed = {"p", "h2", "h3", "strong", "em", "b", "i", "ul", "ol",
               "li", "blockquote", "figure", "figcaption", "br"}
    blocked = {"script", "style", "iframe", "svg", "form", "object", "template"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.blocked_depth = 0
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag in self.blocked:
            self.blocked_depth += 1
            return
        if self.blocked_depth:
            return
        attrs = dict(attrs)
        if tag == "img":
            src = safe_image(attrs.get("src"))
            if src:
                self.out.append('<img src="' + esc(src) + '" alt="' + esc(attrs.get("alt") or "") + '" loading="lazy">')
        elif tag == "a":
            href = str(attrs.get("href") or "").strip()
            parsed = urlparse(href)
            if (href.startswith("/") and not href.startswith("//")) or (parsed.scheme in ("https", "http") and parsed.netloc):
                self.out.append('<a href="' + esc(href) + '" rel="noopener noreferrer">')
                self.links.append("a")
            else:
                self.out.append("<span>")
                self.links.append("span")
        elif tag in self.allowed:
            self.out.append("<" + tag + ">")
    def handle_endtag(self, tag):
        if tag in self.blocked:
            self.blocked_depth = max(0, self.blocked_depth - 1)
        elif not self.blocked_depth:
            if tag == "a" and self.links:
                self.out.append("</" + self.links.pop() + ">")
            elif tag in self.allowed and tag != "br":
                self.out.append("</" + tag + ">")
    def handle_data(self, value):
        if not self.blocked_depth:
            self.out.append(esc(value))
    def handle_entityref(self, name):
        self.handle_data(html.unescape("&" + name + ";"))

def sanitize(value):
    parser = CleanHTML()
    parser.feed(str(value or ""))
    parser.close()
    return "".join(parser.out)

def write_changed(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return
    path.write_text(content, encoding="utf-8")
    print("Atualizado:", path.relative_to(ROOT))

def validate_date(value, slug):
    if not DAY.fullmatch(value):
        raise ValueError("Data inválida em " + slug + ": " + value)
    date.fromisoformat(value)
    return value

def build():
    articles = []
    for path in sorted(SOURCE.glob("*.json")):
        post = json.loads(path.read_text(encoding="utf-8"))
        slug = post.get("slug", "")
        if not SLUG.fullmatch(slug) or path.stem != slug:
            raise ValueError("Slug ou nome de arquivo inválido: " + path.name)
        if not post.get("published", False):
            continue
        for key in ("title", "summary", "category", "seoTitle", "seoDescription", "body", "cover", "coverAlt", "author"):
            if not str(post.get(key) or "").strip():
                raise ValueError("Campo obrigatório ausente: " + slug + "." + key)
        if not safe_image(post["cover"]):
            raise ValueError("Imagem de capa inválida: " + slug)
        post["datePublished"] = validate_date(post["datePublished"], slug)
        post["dateModified"] = validate_date(post.get("dateModified") or post["datePublished"], slug)
        articles.append(post)
    articles.sort(key=lambda p: (p["datePublished"], p["slug"]), reverse=True)

    for post in articles:
        slug = post["slug"]
        url = DOMAIN + "/ludo-conecta/materias/" + slug + "/"
        cover = post["cover"]
        image = DOMAIN + cover
        date_published = post["datePublished"]
        schema = {
            "@context": "https://schema.org", "@type": "BlogPosting",
            "headline": post["title"], "description": post["seoDescription"],
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "url": url, "image": [image],
            "author": {"@type": "Person", "name": post["author"]},
            "publisher": {"@type": "Organization", "name": "Universo Ludo",
                          "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/logo-universo-ludo.png"}},
            "datePublished": date_published, "dateModified": post["dateModified"], "inLanguage": "pt-BR",
        }
        subtitle = '<p class="lc-subtitle">' + esc(post["subtitle"]) + '</p>' if post.get("subtitle") else ""
        caption = "<figcaption>" + esc(post.get("coverCaption")) + "</figcaption>" if post.get("coverCaption") else ""
        content = (
            '<header><span class="lc-tag">' + esc(post["category"]) + '</span>\n'
            '<h1>' + esc(post["title"]) + '</h1>' + subtitle + '\n'
            '<div class="lc-meta"><span>Por ' + esc(post["author"]) + '</span>'
            '<time datetime="' + date_published + '">' + date.fromisoformat(date_published).strftime("%d/%m/%Y") + '</time>'
            '<span>' + str(max(1, int(post.get("readingMinutes") or 5))) + ' min de leitura</span></div></header>\n'
            '<div class="lc-share" data-ludo-share aria-label="Compartilhar esta matéria"></div>\n'
            '<figure class="lc-cover"><img src="' + esc(cover) + '" alt="' + esc(post["coverAlt"]) + '" loading="eager">'
            + caption + '</figure>\n'
            '<div class="lc-content">' + sanitize(post["body"]) + '</div>\n'
            '<div class="lc-share" data-ludo-share aria-label="Compartilhar esta matéria"></div>'
        )
        tokens = {
            "SEO_TITLE": esc(post["seoTitle"]), "SEO_DESCRIPTION": esc(post["seoDescription"]),
            "CANONICAL": esc(url), "OG_IMAGE": esc(image),
            "JSON_LD": json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c"),
            "ARTICLE_CONTENT": content,
        }
        page = TEMPLATE
        for key, value in tokens.items():
            page = page.replace("{{" + key + "}}", value)
        if "{{" in page:
            raise ValueError("Token não resolvido em " + slug)
        write_changed(ROOT / "ludo-conecta/materias" / slug / "index.html", page)

    ordered = [p for p in articles if p.get("featured")] + [p for p in articles if not p.get("featured")]
    posts = [{
        "slug": p["slug"], "title": p["title"], "summary": p["summary"],
        "category": p["category"], "date": p["datePublished"], "image": p["cover"],
        "imageAlt": p["coverAlt"], "url": "/ludo-conecta/materias/" + p["slug"] + "/",
        "featured": bool(p.get("featured")),
    } for p in ordered]
    write_changed(ROOT / "content/ludo-conecta/posts.json", json.dumps(posts, ensure_ascii=False, indent=2) + "\n")
    manifest = {"schemaVersion": 1, "articles": {p["slug"]: p["url"] for p in posts}}
    write_changed(ROOT / "content/ludo-conecta/manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    sitemap = ROOT / "sitemap.xml"
    ET.register_namespace("", NS)
    tree = ET.parse(sitemap)
    root = tree.getroot()
    for node in list(root):
        loc = node.findtext("{" + NS + "}loc") or ""
        if loc.startswith(DOMAIN + "/ludo-conecta/materias/"):
            root.remove(node)
    for p in articles:
        item = ET.SubElement(root, "{" + NS + "}url")
        ET.SubElement(item, "{" + NS + "}loc").text = DOMAIN + "/ludo-conecta/materias/" + p["slug"] + "/"
        ET.SubElement(item, "{" + NS + "}lastmod").text = p["dateModified"]
    ET.indent(tree, space="  ")
    output = '<?xml version="1.0" encoding="utf-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    write_changed(sitemap, output)
    print("Artigos publicados:", len(articles))

if __name__ == "__main__":
    build()
