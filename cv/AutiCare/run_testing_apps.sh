#!/bin/bash

# Streamlit Apps Launcher for AutiCare Screening Models
# This script helps run both testing apps easily

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_banner() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  AutiCare Screening Model - Streamlit Testing Apps Launcher${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

print_menu() {
    echo ""
    echo -e "${YELLOW}Choose which app to run:${NC}"
    echo -e "${GREEN}1${NC}) Image Model Tester"
    echo -e "${GREEN}2${NC}) Hybrid Pipeline Tester"
    echo -e "${GREEN}3${NC}) Run Both Apps (in separate terminals)"
    echo -e "${GREEN}4${NC}) Exit"
    echo ""
}

install_dependencies() {
    echo -e "${YELLOW}Installing Streamlit dependencies...${NC}"
    pip install -q streamlit plotly 2>/dev/null || pip install streamlit plotly
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

run_image_model() {
    echo ""
    echo -e "${GREEN}Starting Image Model Tester...${NC}"
    echo -e "${BLUE}Opening at: http://localhost:8501${NC}"
    echo ""
    streamlit run test_image_model_app.py --server.port 8501
}

run_hybrid_pipeline() {
    echo ""
    echo -e "${GREEN}Starting Hybrid Pipeline Tester...${NC}"
    echo -e "${BLUE}Opening at: http://localhost:8502${NC}"
    echo ""
    streamlit run test_hybrid_pipeline_app.py --server.port 8502
}

run_both() {
    echo ""
    echo -e "${YELLOW}Starting both apps...${NC}"
    echo ""
    echo -e "${GREEN}Image Model Tester will open at: http://localhost:8501${NC}"
    echo -e "${GREEN}Hybrid Pipeline Tester will open at: http://localhost:8502${NC}"
    echo ""
    echo -e "${BLUE}Starting Image Model Tester in background...${NC}"
    streamlit run test_image_model_app.py --server.port 8501 &
    IMAGE_PID=$!
    
    sleep 2
    
    echo -e "${BLUE}Starting Hybrid Pipeline Tester in background...${NC}"
    streamlit run test_hybrid_pipeline_app.py --server.port 8502 &
    HYBRID_PID=$!
    
    echo ""
    echo -e "${GREEN}✓ Both apps are running!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all apps${NC}"
    echo ""
    
    # Wait for both processes
    wait $IMAGE_PID $HYBRID_PID
}

main() {
    print_banner
    
    # Check if streamlit is installed
    if ! command -v streamlit &> /dev/null; then
        echo -e "${YELLOW}Streamlit not found. Installing...${NC}"
        install_dependencies
    fi
    
    while true; do
        print_menu
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1)
                run_image_model
                ;;
            2)
                run_hybrid_pipeline
                ;;
            3)
                run_both
                ;;
            4)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please enter 1-4.${NC}"
                ;;
        esac
    done
}

# Run main function
main
