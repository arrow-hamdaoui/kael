import ast

with open('admin_reconstructed.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('admin.html', 'w', encoding='utf-8') as f:
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        try:
            if stripped.startswith('"') and stripped.endswith('"'):
                decoded = ast.literal_eval(stripped)
                f.write(decoded + '\n')
            else:
                f.write(line)
        except Exception as e:
            f.write(line)
