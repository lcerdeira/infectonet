# Configuration file for the Sphinx documentation builder.
# https://www.sphinx-doc.org/en/master/usage/configuration.html

project   = 'InfectoNET'
copyright = '2024–2026, InfectoNET / LSHTM'
author    = 'InfectoNET Team'
release   = '0.1'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx_copybutton',
    'myst_parser',
]

templates_path   = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# ── HTML output ──────────────────────────────────────────────────────────────
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_css_files   = ['custom.css']

html_theme_options = {
    'logo_only':          False,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': True,
    'collapse_navigation': False,
    'sticky_navigation':   True,
    'navigation_depth':    4,
    'includehidden':       True,
    'titles_only':         False,
}

html_context = {
    'display_github': True,
    'github_user':    'lcerdeira',
    'github_repo':    'infectonet',
    'github_version': 'main',
    'conf_py_path':   '/docs/',
}

# ── MyST (Markdown) settings ─────────────────────────────────────────────────
myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'tasklist',
]

# ── copy button — strip prompt characters ────────────────────────────────────
copybutton_prompt_text = r'^\$ |^>>> '
copybutton_prompt_is_regexp = True
