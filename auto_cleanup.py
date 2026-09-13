import os

print("🚀 Starting automated cleanup for SupplyShield...\n")

# 1. Clean python/ui_theme.py (Remove unused imports)
file1 = "python/ui_theme.py"
if os.path.exists(file1):
    with open(file1, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Filter out the unused imports
    new_lines = [line for line in lines if line.strip() not in ["import os", "import json"]]
    
    with open(file1, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("✅ Cleaned unused imports in python/ui_theme.py")

# 2. Fix python/module1_graph_construction.py (Add numpy, remove no-op)
file2 = "python/module1_graph_construction.py"
if os.path.exists(file2):
    with open(file2, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add numpy import if networkx is there and numpy isn't
    if "import networkx as nx" in content and "import numpy as np" not in content:
        content = content.replace("import networkx as nx", "import networkx as nx\nimport numpy as np")
    
    # Remove the useless no-op line
    content = content.replace("nx.set_graph_attr = lambda: None  # no-op\n", "")
    content = content.replace("nx.set_graph_attr = lambda: None  # no-op", "") # fallback without newline
    
    with open(file2, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Fixed missing numpy import and removed no-op code in python/module1_graph_construction.py")

# 3. Fix python/run_pipeline.py (Update outdated docstring)
file3 = "python/run_pipeline.py"
if os.path.exists(file3):
    with open(file3, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("streamlit run module5_dashboard.py", "streamlit run 0_🏠_Overview.py")
    
    with open(file3, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Updated outdated dashboard filename in python/run_pipeline.py")

# 4. Remove duplicate .env.example from root (keep the one in python/)
root_env = ".env.example"
if os.path.exists(root_env):
    os.remove(root_env)
    print("✅ Removed duplicate .env.example from root directory")

print("\n🎉 Cleanup complete! You can now commit and push these changes.")
