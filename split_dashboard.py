import re
import os

with open('client-dashboard.html', 'r', encoding='utf-8') as f:
    dashboard_content = f.read()

# Find archive-view
match_archive = re.search(r'<div id="archive-view">.*?</div> <!-- End of archive-view -->', dashboard_content, re.DOTALL)
if match_archive:
    submit_page = dashboard_content.replace(match_archive.group(0), '')
else:
    submit_page = dashboard_content

# Unhide submit-case
submit_page = submit_page.replace('style="display: none; border-radius: 12px; margin-top: 1rem;"', 'style="border-radius: 12px; margin-top: 1rem;"')

# Change toggleSubmitForm() to window.location.href='client-dashboard.html'
submit_page = submit_page.replace('onclick="toggleSubmitForm()"', 'onclick="window.location.href=\'client-dashboard.html\'"')
submit_page = submit_page.replace('toggleSubmitForm(); resetForm();', 'window.location.href=\'client-dashboard.html\'')

# Add <script src="js/app.js" defer></script> before </body> if not exists
if 'js/app.js' not in submit_page:
    submit_page = submit_page.replace('</body>', '    <script src="js/app.js" defer></script>\n</body>')

# Change page title
submit_page = submit_page.replace('<title>Client Dashboard', '<title>Submit Case')

with open('client-submit.html', 'w', encoding='utf-8') as f:
    f.write(submit_page)

# Now remove submit-case from client-dashboard.html
match_submit = re.search(r'<!-- Smart Case Submission Section -->.*?</section>', dashboard_content, re.DOTALL)
if match_submit:
    new_dashboard = dashboard_content.replace(match_submit.group(0), '')
else:
    new_dashboard = dashboard_content

# Update button in client-dashboard.html
new_dashboard = new_dashboard.replace('<button class="btn btn-primary" onclick="toggleSubmitForm()" style="margin-left: auto;">', '<a href="client-submit.html" class="btn btn-primary" style="margin-left: auto; text-decoration: none;">')
new_dashboard = new_dashboard.replace('<i class="fa-solid fa-plus"></i> Submit New Case\n            </button>', '<i class="fa-solid fa-plus"></i> Submit New Case\n            </a>')

with open('client-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(new_dashboard)

print('Successfully created client-submit.html and updated client-dashboard.html')
