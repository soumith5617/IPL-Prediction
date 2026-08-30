"""
Quick Launcher for IPL Prediction System.
Starts the FastAPI Backend and Vite Frontend concurrently or individually.

Usage:
    python run_system.py          (Runs both backend and frontend)
    python run_system.py --backend-only
    python run_system.py --frontend-only
"""

import sys
import os
import subprocess
import time

def run():
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    
    if os.name == 'nt':
        frontend_cmd = ["cmd", "/c", "npm", "run", "dev"]
    else:
        frontend_cmd = ["npm", "run", "dev"]

    args = sys.argv[1:]
    
    if "--backend-only" in args:
        print("[*] Starting FastAPI Backend on http://127.0.0.1:8000...")
        subprocess.run(backend_cmd)
    elif "--frontend-only" in args:
        print("[*] Starting React Frontend on http://localhost:3000...")
        subprocess.run(frontend_cmd, cwd="frontend")
    else:
        print("="*65)
        print("   [IPL] PREDICTION & SPORTS ANALYTICS SYSTEM LAUNCHER")
        print("="*65)
        print("[*] Backend API: http://127.0.0.1:8000 (Swagger: /docs)")
        print("[*] React UI:    http://localhost:3000")
        print("="*65)
        
        backend_proc = subprocess.Popen(backend_cmd)
        time.sleep(2)
        try:
            frontend_proc = subprocess.Popen(frontend_cmd, cwd="frontend")
            backend_proc.wait()
            frontend_proc.wait()
        except KeyboardInterrupt:
            print("\n[*] Shutting down servers...")
            backend_proc.terminate()
            if 'frontend_proc' in locals():
                frontend_proc.terminate()

if __name__ == "__main__":
    run()
