# Smart Billing Manager

Smart Billing Manager is a modern billing and invoice management web application built using React.js.  
The main goal of this project is to simplify billing operations with a clean user interface and smooth user experience.

This project allows users to create bills, calculate GST automatically, manage invoice details, and generate printable bills. The application is fully responsive and works properly on desktop, tablet, and mobile devices.

The project was created as a frontend practice project to improve React.js skills and understand real-world billing system workflows.

---

# Preview

The application includes:

- Billing Dashboard
- Product & Invoice Management
- GST Calculation
- Bill Summary
- Printable Invoice Layout
- Responsive User Interface
- Local Storage Support

---

# Features

## Smart Billing System

Users can create bills dynamically by adding product details such as:
- Product Name
- Quantity
- Price
- GST Percentage

The system automatically calculates:
- Total Price
- GST Amount
- Final Bill Amount

---

## GST Calculation

GST calculation is handled automatically inside the application.

Features include:
- Real-time GST calculation
- Automatic bill total update
- Percentage-based tax support
- Accurate invoice summary

---

## Invoice Generation

The project supports professional invoice generation.

Invoice section includes:
- Customer details
- Product summary
- GST breakdown
- Total amount
- Printable invoice layout

---

## Dashboard & Analytics

The dashboard provides:
- Billing overview
- Sales information
- Revenue summary
- Quick access sections

---

## Local Storage Support

The application stores data using browser local storage.

Benefits:
- Data remains after refresh
- No database required
- Faster frontend storage handling

---

## Responsive Design

The UI is fully responsive and optimized for:
- Desktop
- Laptop
- Tablet
- Mobile devices

---

## Form Validation

Basic form validation has been added to prevent:
- Empty fields
- Invalid input values
- Incorrect bill entries

---

## Print & PDF Support

The project supports:
- Print invoice feature
- PDF-ready bill layout
- Clean invoice formatting

---

# Technologies Used

This project is built using:

- React.js
- JavaScript (ES6)
- HTML5
- CSS3

---

# How To Run This Project

## Step 1: Set Execution Policy (Windows PowerShell)
-- Open Windows PowerShell as Administrator and run this command:  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
- Press Enter if asked for permission.

## Step 2: Create React App
-- Open VS Code Terminal and run:  npx create-react-app smart-billing-manager

## Step 3: Confirm Installation
-- When it asks for confirmation, type:  y

## Step 4: Go to Project Folder
-- Run this command:  cd smart-billing-manager

## Step 5: Start the Project
-- Run:  npm start

## Step 6: Open in Browser
-- After running the command, the project will automatically open in your default browser.

## Step 7: Open Project in VS Code Explorer
- On the left side panel in VS Code:
- Click on smart-billing-manager

## Step 8: Go to Source Folder
- Open the **src** folder

## Step 9: Edit Main File
- Click on App.js
- Delete all existing code
- Paste your main billing system code

## Step 10: View Final Output
- Go back to the browser — your Smart Billing Manager will be running successfully.

---

# Folder Structure

```bash
smart-billing-manager/
│
├── public/
│
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   ├── components/
│   └── assets/
│
├── package.json
├── package-lock.json
└── README.md
