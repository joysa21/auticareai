#!/usr/bin/env python3
"""
AutiCare Screening Models - Streamlit Testing Apps Launcher
Allows easy launching of testing applications for model validation
"""

import sys
import os
import subprocess
import time
from pathlib import Path

# Get current directory
SCRIPT_DIR = Path(__file__).parent
os.chdir(SCRIPT_DIR)

class Colors:
    """ANSI color codes"""
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Print application banner"""
    print(f"{Colors.BLUE}{'=' * 70}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}  AutiCare Screening Model - Streamlit Testing Apps Launcher{Colors.ENDC}")
    print(f"{Colors.BLUE}{'=' * 70}{Colors.ENDC}")
    print()

def print_menu():
    """Print main menu"""
    print(f"{Colors.YELLOW}Choose which app to run:{Colors.ENDC}")
    print(f"{Colors.GREEN}1{Colors.ENDC}) Image Model Tester - Test image classification model")
    print(f"{Colors.GREEN}2{Colors.ENDC}) Hybrid Pipeline Tester - Test complete video screening pipeline")
    print(f"{Colors.GREEN}3{Colors.ENDC}) Run Both Apps (in separate terminals)")
    print(f"{Colors.GREEN}4{Colors.ENDC}) Install Dependencies")
    print(f"{Colors.GREEN}5{Colors.ENDC}) Exit")
    print()

def install_dependencies():
    """Install required dependencies"""
    print(f"{Colors.YELLOW}Installing Streamlit dependencies...{Colors.ENDC}")
    
    packages = ['streamlit', 'plotly', 'pandas', 'matplotlib']
    
    for package in packages:
        try:
            print(f"  Installing {package}...", end=" ")
            subprocess.run(
                [sys.executable, '-m', 'pip', 'install', '-q', package],
                check=True,
                capture_output=True
            )
            print(f"{Colors.GREEN}✓{Colors.ENDC}")
        except subprocess.CalledProcessError:
            print(f"{Colors.RED}✗{Colors.ENDC}")
            print(f"  Failed to install {package}. Please try manually: pip install {package}")
    
    print(f"{Colors.GREEN}✓ Dependencies installation complete{Colors.ENDC}")
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    required = ['streamlit']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"{Colors.YELLOW}Missing dependencies: {', '.join(missing)}{Colors.ENDC}")
        print(f"Installing required packages...{Colors.ENDC}")
        install_dependencies()
        return False
    return True

def run_image_model():
    """Run image model testing app"""
    print()
    print(f"{Colors.GREEN}Starting Image Model Tester...{Colors.ENDC}")
    print(f"{Colors.BLUE}Opening at: http://localhost:8501{Colors.ENDC}")
    print()
    
    try:
        subprocess.run(
            [sys.executable, '-m', 'streamlit', 'run', 'test_image_model_app.py', '--server.port', '8501'],
            cwd=str(SCRIPT_DIR)
        )
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Image Model Tester stopped{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.RED}Error running Image Model Tester: {e}{Colors.ENDC}")

def run_hybrid_pipeline():
    """Run hybrid pipeline testing app"""
    print()
    print(f"{Colors.GREEN}Starting Hybrid Pipeline Tester...{Colors.ENDC}")
    print(f"{Colors.BLUE}Opening at: http://localhost:8502{Colors.ENDC}")
    print()
    
    try:
        subprocess.run(
            [sys.executable, '-m', 'streamlit', 'run', 'test_hybrid_pipeline_app.py', '--server.port', '8502'],
            cwd=str(SCRIPT_DIR)
        )
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Hybrid Pipeline Tester stopped{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.RED}Error running Hybrid Pipeline Tester: {e}{Colors.ENDC}")

def run_both():
    """Run both apps simultaneously"""
    print()
    print(f"{Colors.YELLOW}Starting both apps in separate processes...{Colors.ENDC}")
    print()
    print(f"{Colors.GREEN}Image Model Tester will open at: http://localhost:8501{Colors.ENDC}")
    print(f"{Colors.GREEN}Hybrid Pipeline Tester will open at: http://localhost:8502{Colors.ENDC}")
    print()
    
    processes = []
    
    try:
        print(f"{Colors.BLUE}Starting Image Model Tester...{Colors.ENDC}")
        p1 = subprocess.Popen(
            [sys.executable, '-m', 'streamlit', 'run', 'test_image_model_app.py', '--server.port', '8501'],
            cwd=str(SCRIPT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        processes.append(("Image Model Tester", p1))
        
        time.sleep(2)
        
        print(f"{Colors.BLUE}Starting Hybrid Pipeline Tester...{Colors.ENDC}")
        p2 = subprocess.Popen(
            [sys.executable, '-m', 'streamlit', 'run', 'test_hybrid_pipeline_app.py', '--server.port', '8502'],
            cwd=str(SCRIPT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        processes.append(("Hybrid Pipeline Tester", p2))
        
        print()
        print(f"{Colors.GREEN}✓ Both apps are running!{Colors.ENDC}")
        print(f"{Colors.YELLOW}Press Ctrl+C to stop all apps{Colors.ENDC}")
        print()
        
        # Wait for both processes
        for name, process in processes:
            process.wait()
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Stopping all apps...{Colors.ENDC}")
        for name, process in processes:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            print(f"  {Colors.GREEN}✓{Colors.ENDC} {name} stopped")
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.ENDC}")

def main():
    """Main application loop"""
    print_banner()
    
    # Check and install dependencies if needed
    if not check_dependencies():
        print(f"{Colors.YELLOW}Please try running the app again.{Colors.ENDC}")
        print()
    
    while True:
        print_menu()
        
        try:
            choice = input(f"{Colors.BOLD}Enter your choice (1-5): {Colors.ENDC}").strip()
            
            if choice == '1':
                run_image_model()
            elif choice == '2':
                run_hybrid_pipeline()
            elif choice == '3':
                run_both()
            elif choice == '4':
                install_dependencies()
            elif choice == '5':
                print(f"{Colors.GREEN}Exiting...{Colors.ENDC}")
                sys.exit(0)
            else:
                print(f"{Colors.RED}Invalid choice. Please enter 1-5.{Colors.ENDC}")
                print()
        except KeyboardInterrupt:
            print(f"\n{Colors.GREEN}Exiting...{Colors.ENDC}")
            sys.exit(0)
        except Exception as e:
            print(f"{Colors.RED}Error: {e}{Colors.ENDC}")
            print()

if __name__ == "__main__":
    main()
