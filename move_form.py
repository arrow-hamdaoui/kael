import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

match = re.search(r'<!-- Smart Case Submission Section -->.*?<section id="submit-case".*?</section>', index_content, re.DOTALL)
if match:
    submit_section = match.group(0)
    
    # Remove from index.html
    new_index = index_content.replace(submit_section, '')
    new_index = new_index.replace('href="#submit-case"', 'href="client-dashboard.html#submit-case"')
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_index)
        
    # Process submit_section to remove step 5 (Contact Info)
    submit_section = re.sub(r'<div class="step-item" data-step="5">.*?</div>', '', submit_section, flags=re.DOTALL)
    
    submit_section = submit_section.replace('<div class="step-item" data-step="6">', '<div class="step-item" data-step="5">')
    submit_section = submit_section.replace('<div class="step-circle">6</div>', '<div class="step-circle">5</div>')
    
    # Remove Step 5 form content using regex
    submit_section = re.sub(r'<!-- Step 5: Contact Info -->.*?</div>\s*</div>\s*</div>\s*(?=<!-- Step 6: Review & Submit -->)', '', submit_section, flags=re.DOTALL)
    
    submit_section = submit_section.replace('<!-- Step 6: Review & Submit -->', '<!-- Step 5: Review & Submit -->')
    submit_section = submit_section.replace('<div class="form-step" id="step-6">', '<div class="form-step" id="step-5">')
    
    with open('client-dashboard.html', 'r', encoding='utf-8') as f:
        dashboard_content = f.read()
        
    new_dashboard = dashboard_content.replace('</main>', submit_section + '\n    </main>')
    
    with open('client-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(new_dashboard)
        
    print('Successfully moved and updated submit-case HTML')
else:
    print('Could not find submit-case section')
