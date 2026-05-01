import re

def update_file(filename, active_tab):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new HTML
    new_html = """
    <style>
        .client-layout {
            display: flex;
            min-height: 100vh;
            background: var(--dash-bg);
        }
        .client-sidebar {
            width: 260px;
            background: white;
            border-right: 1px solid var(--dash-border);
            display: flex;
            flex-direction: column;
            position: fixed;
            height: 100vh;
            left: 0;
            top: 0;
            z-index: 100;
        }
        .client-brand {
            padding: 1.5rem;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--dash-text);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-bottom: 1px solid var(--dash-border);
            text-decoration: none;
        }
        .client-brand img { height: 32px; border-radius: 6px; }
        .client-user {
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid var(--dash-border);
        }
        .client-nav {
            padding: 1.5rem 0;
            flex: 1;
        }
        .client-nav a {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.5rem;
            color: var(--dash-text-light);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }
        .client-nav a:hover {
            background: var(--dash-hover);
            color: var(--dash-primary);
        }
        .client-nav a.active {
            background: #f0f9ff;
            color: var(--dash-primary);
            border-left-color: var(--dash-primary);
            font-weight: 600;
        }
        .client-nav a i { font-size: 1.25rem; width: 24px; text-align: center; }
        .client-main {
            flex: 1;
            margin-left: 260px;
            padding: 2rem;
            width: calc(100% - 260px);
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="client-layout">
        <!-- Sidebar -->
        <aside class="client-sidebar">
            <a href="index.html" class="client-brand">
                <img src="images/logo.png" alt="Kael Logo" onerror="this.style.display='none';">
                KAEL PORTAL
            </a>
            
            <div class="client-user">
                <div class="dash-avatar" id="sidebar-avatar">--</div>
                <div style="overflow: hidden;">
                    <p class="dash-user-name" id="sidebar-name" style="font-weight: 600; margin: 0; font-size: 0.95rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">Loading...</p>
                    <p class="dash-user-clinic" id="sidebar-clinic" style="font-size: 0.8rem; color: var(--dash-text-light); margin: 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">Clinic</p>
                </div>
            </div>

            <nav class="client-nav">
                <a href="client-dashboard.html" class="[ARCHIVE_ACTIVE]"><i class="fa-solid fa-folder-open"></i> My Case Archive</a>
                <a href="client-submit.html" class="[SUBMIT_ACTIVE]"><i class="fa-solid fa-plus-circle"></i> Submit New Case</a>
            </nav>

            <div style="padding: 1.5rem; border-top: 1px solid var(--dash-border);">
                <button onclick="clientLogout()" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer; border-radius: 8px; transition: background 0.2s;">
                    <i class="fa-solid fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="client-main">
"""

    if active_tab == 'archive':
        new_html = new_html.replace('[ARCHIVE_ACTIVE]', 'active')
        new_html = new_html.replace('[SUBMIT_ACTIVE]', '')
    else:
        new_html = new_html.replace('[ARCHIVE_ACTIVE]', '')
        new_html = new_html.replace('[SUBMIT_ACTIVE]', 'active')

    # Find the boundary to replace
    # We want to replace from </head>\s*<body> down to <main class="dash-container">
    pattern = r'</head>\s*<body>.*?<main class="dash-container">'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_html, content, flags=re.DOTALL)
        
        # We also need to add a closing </div> for client-layout right before </body>
        content = content.replace('</body>', '    </div>\n</body>')
        
        # Write back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Successfully updated {filename}')
    else:
        print(f'Pattern not found in {filename}')

update_file('client-dashboard.html', 'archive')
update_file('client-submit.html', 'submit')

