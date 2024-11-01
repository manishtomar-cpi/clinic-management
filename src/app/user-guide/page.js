// src/app/pages/user-guide.js

"use client";

import React from 'react';
import Header from '../components/userGuide/Header';
import TableOfContents from '../components/userGuide/TableOfContents';
import Section from '../components/userGuide/Section';
import FAQ from '../components/userGuide/FAQ';
import Support from '../components/userGuide/Support';
import Footer from '../components/userGuide/Footer';
import {
  FaUserMd,
  FaChartLine,
  FaCalendarAlt,
  FaUserFriends,
  FaMoneyCheckAlt,
  FaUserShield,
  FaTools,
  FaLaptopMedical,
  FaUsers,
  FaShieldAlt,
  FaClinicMedical,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const UserGuide = () => {
  const tableOfContentsItems = [
    { title: 'Getting Started', link: '#getting-started' },
    { title: 'Dashboard Overview', link: '#dashboard-overview' },
    { title: 'Managing Patients', link: '#managing-patients' },
    { title: 'Appointments and Visits', link: '#appointments-and-visits' },
    { title: 'Treatment Management', link: '#treatment-management' },
    { title: 'Financial Management', link: '#financial-management' },
    { title: 'Profile and Account Settings', link: '#profile-and-account-settings' },
    { title: 'Data Security and Privacy', link: '#data-security-and-privacy' },
    { title: 'Frequently Asked Questions (FAQ)', link: '#faq' },
    { title: 'Support and Contact Information', link: '#support' },
    { title: 'Conclusion', link: '#conclusion' },
  ];

  const faqData = [
    // General Questions
    {
      category: 'General Questions',
      question: 'How do I register and create an account on the clinic management app?',
      answer:
        'You can register by clicking on the "Sign Up" button on the homepage. Fill out the required information, including your username, name, clinic name, and location. Ensure your username is unique and verify your email with the OTP sent to your email address. Set a secure password following the password requirements, and submit the form to create your account.',
    },
    {
      category: 'General Questions',
      question: 'What are the password requirements for creating an account?',
      answer:
        'Your password must be at least 8 characters long and include at least one uppercase letter and one special character. This ensures your account remains secure.',
    },
    {
      category: 'General Questions',
      question: 'How do I log in to the app?',
      answer:
        'Click on the "Login" button on the homepage. Enter your registered username and password. If you\'ve forgotten your password, you can use the "Forgot Password" feature to reset it.',
    },
    {
      category: 'General Questions',
      question: 'I forgot my password. How can I reset it?',
      answer:
        'On the login page, click the "Forgot Password" link. Enter your username, and we\'ll send an OTP to your registered email. Enter the OTP to verify your identity, and then set a new password.',
    },
    {
      category: 'General Questions',
      question: 'How secure is my data in the app?',
      answer:
        'We prioritize your data security by encrypting sensitive information and using secure authentication methods. All patient data is encrypted and accessible only to authorized users.',
    },
    {
      category: 'General Questions',
      question: 'Can I integrate this app with other medical software?',
      answer:
        'Yes, ClinicEase offers integration with various medical software solutions. Please contact our support team for specific integration requirements.',
    },
  
    // Dashboard and Navigation
    {
      category: 'Dashboard and Navigation',
      question: 'What features are available on the dashboard?',
      answer:
        'The dashboard provides quick access to key features such as viewing total patients, ongoing treatments, today\'s appointments, missed appointments, and patients with outstanding balances. It also includes tiles with real-time statistics and allows you to navigate to different sections like adding patients, scheduling visits, and managing appointments.',
    },
    {
      category: 'Dashboard and Navigation',
      question: 'How do I navigate to different sections of the app?',
      answer:
        'Use the sidebar on the left side of the screen to navigate between different sections like "Add Patient," "Add Visit," "Search Patient," "Appointments Today," "Missed Appointments," and more.',
    },
    {
      category: 'Dashboard and Navigation',
      question: 'Can I access the app on my mobile device?',
      answer:
        'Yes, the app is designed to be responsive and works on mobile devices. The sidebar menu can be toggled open or closed on mobile for easier navigation.',
    },
  
    // Patient Management
    {
      category: 'Patient Management',
      question: 'How do I add a new patient to the system?',
      answer:
        'Go to the "Add Patient" section from the sidebar. Fill out the multi-step form with the patient\'s basic information, contact details, medical condition, and notes. The system will generate unique login credentials for the patient, which can be emailed directly to them.',
    },
    {
      category: 'Patient Management',
      question: 'Can I edit a patient\'s information after adding them?',
      answer:
        'Yes, you can search for the patient using the "Search Patient" feature and update their information as needed.',
    },
    {
      category: 'Patient Management',
      question: 'How do I search for a patient?',
      answer:
        'Navigate to the "Search Patient" section from the sidebar. You can search by name, address, or visit date. Enter at least one search criterion and click "Search" to view matching patient records.',
    },
    {
      category: 'Patient Management',
      question: 'How can I view a patient\'s detailed visit history?',
      answer:
        'After searching and selecting a patient, you can view their profile, which includes personal details and a timeline of all their visits. Click on a specific visit to see detailed information about that visit.',
    },
  
    // Appointment Scheduling and Management
    {
      category: 'Appointment Scheduling and Management',
      question: 'How do I schedule a new appointment or visit for a patient?',
      answer:
        'Go to the "Add Visit" section from the sidebar. Select the patient, enter visit details such as symptoms, reasons, prescribed medicines, treatment status, and financial information. You can also schedule the next visit during this process.',
    },
    {
      category: 'Appointment Scheduling and Management',
      question: 'How are appointments categorized in the app?',
      answer:
        'Appointments are categorized as "Upcoming," "Completed," "Missed," or "Rescheduled." This helps you manage and prioritize your appointments effectively.',
    },
    {
      category: 'Appointment Scheduling and Management',
      question: 'How does the app handle missed appointments?',
      answer:
        'The app automatically updates the status of missed appointments based on the scheduled time. Missed appointments are highlighted, and you can reschedule them directly from the "Missed Appointments" section.',
    },
    {
      category: 'Appointment Scheduling and Management',
      question: 'Can I reschedule a missed appointment?',
      answer:
        'Yes, in the "Missed Appointments" section, you can select a missed appointment and use the reschedule feature to set a new date and time.',
    },
    {
      category: 'Appointment Scheduling and Management',
      question: 'How do I view today\'s appointments?',
      answer:
        'Navigate to the "Appointments Today" section from the sidebar. You can see all appointments scheduled for today, filter them by status, and search by patient name.',
    },
    {
      category: 'Appointment Scheduling and Management',
      question: 'How are appointment statuses updated automatically?',
      answer:
        'The app checks appointment times in real-time and updates statuses accordingly. For example, if an appointment time has passed and it hasn\'t been marked as completed, it will automatically change to "Missed."',
    },
  
    // Treatment Management
    {
      category: 'Treatment Management',
      question: 'How do I update a patient\'s treatment status?',
      answer:
        'In the "Ongoing Patients" section, you can view all patients with ongoing treatments. From there, you can mark a treatment as "Completed" or "Stopped" using the provided buttons.',
    },
    {
      category: 'Treatment Management',
      question: 'What happens when I mark a treatment as completed?',
      answer:
        'The patient\'s treatment status is updated in the system, and they are removed from the "Ongoing Patients" list. Their treatment history remains accessible in their patient profile.',
    },
    {
      category: 'Treatment Management',
      question: 'Can I add notes to a patient\'s visit or treatment?',
      answer:
        'Yes, when adding or editing a visit, you can include notes in the designated field. These notes will be stored with the visit details.',
    },
  
    // Financial Management
    {
      category: 'Financial Management',
      question: 'How do I track patients with outstanding balances?',
      answer:
        'Go to the "Patients with Balance" section from the sidebar. You\'ll see a list of patients who have outstanding balances, along with details of each visit and the amounts owed.',
    },
    {
      category: 'Financial Management',
      question: 'Can I update payment information for a patient?',
      answer:
        'Yes, when recording a visit in the "Add Visit" section, you can enter the total amount and the amount paid. You can update this information later if needed.',
    },
    {
      category: 'Financial Management',
      question: 'How does the app calculate the remaining balance for a patient?',
      answer:
        'The app calculates the balance by subtracting the amount paid from the total amount for each visit. It sums up outstanding balances across all visits to show the total amount owed by the patient.',
    },
  
    // Profile and Account Settings
    {
      category: 'Profile and Account Settings',
      question: 'How do I update my profile information?',
      answer:
        'Navigate to the "Update Profile" section from the sidebar. You can update your name, clinic name, location, and other personal details.',
    },
    {
      category: 'Profile and Account Settings',
      question: 'Can I change my password?',
      answer:
        'Yes, in the "Update Profile" section, you can change your password by entering your current password and setting a new one.',
    },
    {
      category: 'Profile and Account Settings',
      question: 'What should I do if I suspect unauthorized access to my account?',
      answer:
        'Immediately change your password and contact support for further assistance. Ensure your password meets the security requirements.',
    },
  
    // Technical Issues and Support
    {
      category: 'Technical Issues and Support',
      question: 'I\'m experiencing errors or the app is not functioning properly. What should I do?',
      answer:
        'Try refreshing the page or logging out and back in. If the problem persists, contact support with details of the issue.',
    },
    {
      category: 'Technical Issues and Support',
      question: 'How do I report a bug or request a new feature?',
      answer:
        'Use the "Contact Support" option in the app to send us a message describing the bug or your feature request.',
    },
    {
      category: 'Technical Issues and Support',
      question: 'What browsers are supported by the app?',
      answer:
        'The app supports modern browsers such as Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. For the best experience, ensure your browser is up to date.',
    },
  
    // Security and Data Privacy
    {
      category: 'Security and Data Privacy',
      question: 'How is patient data secured in the app?',
      answer:
        'All patient data is encrypted and stored securely. Access to patient data is restricted to authorized users only. We follow industry best practices to ensure data privacy and security.',
    },
    {
      category: 'Security and Data Privacy',
      question: 'Can patients access their own records?',
      answer:
        'Yes, patients can log in using the credentials provided to them and access their visit summaries and personal information.',
    },
    {
      category: 'Security and Data Privacy',
      question: 'What should I do if I suspect a data breach?',
      answer:
        'Contact support immediately with details of your concern. We take data security seriously and will investigate promptly.',
    },
  
    // Miscellaneous
    {
      category: 'Miscellaneous',
      question: 'Can I export patient data or reports from the app?',
      answer:
        'Currently, the app does not support exporting data. We are working on adding this feature in future updates.',
    },
    {
      category: 'Miscellaneous',
      question: 'Is there a limit to the number of patients I can add?',
      answer:
        'No, there is no limit. You can add as many patients as needed to manage your clinic effectively.',
    },
    {
      category: 'Miscellaneous',
      question: 'How do I log out of the app?',
      answer:
        'Click on the "Logout" button at the bottom of the sidebar to securely log out of your account.',
    },
  ];
  
  

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <section className="mb-16 bg-gradient-to-r from-teal-100 to-teal-200 p-8 rounded-lg shadow-md">
          <div className="text-center">
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-teal-800 mb-4"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              Welcome to ClinicEase User Guide
            </motion.h1>
            <motion.p
              className="text-lg md:text-2xl text-teal-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Your comprehensive solution for managing patient records, appointments, treatments, and finances with ease and security.
            </motion.p>
            {/* Carousel */}
            <div className="max-w-4xl mx-auto">
              <Carousel
                showThumbs={false}
                infiniteLoop
                autoPlay
                interval={5000}
                showStatus={false}
                transitionTime={800}
                swipeable
                emulateTouch
                dynamicHeight={false}
              >
                <div className="flex flex-col items-center">
                  <FaUserMd className="text-6xl text-teal-500 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Step 1: Sign Up</h3>
                  <p className="text-center text-teal-600">
                    Register with a unique username and verify your email to get started.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <FaChartLine className="text-6xl text-green-500 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Step 2: Dashboard Overview</h3>
                  <p className="text-center text-green-600">
                    Access key metrics and navigate through your clinic operations seamlessly.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <FaCalendarAlt className="text-6xl text-purple-500 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Step 3: Manage Appointments</h3>
                  <p className="text-center text-purple-600">
                    Schedule, view, and manage your appointments with ease.
                  </p>
                </div>
                {/* Add more slides as needed */}
              </Carousel>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <TableOfContents items={tableOfContentsItems} />

        {/* Sections */}
        {/* Getting Started */}
        <Section
          id="getting-started"
          title="Getting Started"
          icon={<FaUserMd className="text-4xl text-teal-500 mr-4" />}
          background="from-teal-200 to-teal-300"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-teal-700">Registration and Account Setup</h3>
              <p className="text-lg text-gray-600">
                Welcome to the beginning of a seamless clinic management experience!
              </p>
              {/* Steps */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700">
                <li>
                  <strong>Access the Registration Page:</strong> Visit the{' '}
                  <a href="#" className="text-teal-500 hover:underline">
                    Sign Up
                  </a>{' '}
                  page to create your account. You'll be greeted with a friendly interface featuring a gradient background in calming medical blues and greens, symbolizing trust and tranquility.
                </li>
                <li>
                  <strong>Fill Out Your Information:</strong> Enter your username, name, clinic name, and location.
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    <li>
                      <strong>Username Validation:</strong> Ensure your username is unique. An animated checkmark icon confirms its availability in real-time.
                    </li>
                    <li>
                      <strong>Email Verification:</strong> Click on the "Send OTP" button. An animated email icon indicates that an OTP (One-Time Password) is being sent to your email.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Set a Secure Password:</strong> Your password must be at least 8 characters long, include one uppercase letter, and one special character. Use the eye icon to toggle password visibility for convenience.
                </li>
                <li>
                  <strong>Complete Registration:</strong> Submit the form. Upon success, a celebratory animation (e.g., confetti) welcomes you to the app.
                </li>
              </ol>
            </motion.div>

            {/* Additional subsections can be similarly styled */}
          </div>
        </Section>

        {/* Dashboard Overview */}
        <Section
          id="dashboard-overview"
          title="Dashboard Overview"
          icon={<FaChartLine className="text-4xl text-green-500 mr-4" />}
          background="from-green-200 to-green-300"
        >
          <div className="space-y-6">
            {/* Navigation Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center"
            >
              <h3 className="text-2xl font-semibold mb-4 text-green-700">Navigation Sidebar</h3>
              <p className="text-lg text-gray-600 text-center">
                The sidebar provides easy navigation to all major sections of the app. Each menu item is accompanied by a colorful icon for quick recognition.
              </p>
              {/* Sidebar Screenshot */}
              <div className="mt-4">
                <img src="/images/sidebar-screenshot.png" alt="Sidebar Screenshot" className="w-full max-w-md rounded-lg shadow-lg" />
              </div>
            </motion.div>

            {/* Dashboard Tiles and Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-green-700">Dashboard Tiles and Quick Stats</h3>
              <p className="text-lg text-gray-600">
                The dashboard provides real-time statistics and quick access to key features through interactive tiles. Each tile represents a critical aspect of your clinic operations.
              </p>
              {/* Tiles Animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {[
                  { title: 'Total Patients', icon: <FaUsers className="text-white text-4xl" />, bg: 'bg-teal-500' },
                  { title: 'Ongoing Treatments', icon: <FaUserShield className="text-white text-4xl" />, bg: 'bg-green-500' },
                  { title: 'Today\'s Appointments', icon: <FaCalendarAlt className="text-white text-4xl" />, bg: 'bg-purple-500' },
                  { title: 'Missed Appointments', icon: <FaTools className="text-white text-4xl" />, bg: 'bg-red-500' },
                  { title: 'Outstanding Balance', icon: <FaMoneyCheckAlt className="text-white text-4xl" />, bg: 'bg-yellow-500' },
                  { title: 'Patient Analytics', icon: <FaLaptopMedical className="text-white text-4xl" />, bg: 'bg-indigo-500' },
                ].map((tile, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center p-6 rounded-lg shadow-lg cursor-pointer ${tile.bg}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="mr-4">{tile.icon}</div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">{tile.title}</h4>
                      <p className="text-white">Click to explore more details.</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Managing Patients */}
        <Section
          id="managing-patients"
          title="Managing Patients"
          icon={<FaUserFriends className="text-4xl text-orange-500 mr-4" />}
          background="from-orange-200 to-orange-300"
        >
          <div className="space-y-6">
            {/* Adding a New Patient */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-orange-700">Adding a New Patient</h3>
              <p className="text-lg text-gray-600">
                Easily add new patients to your system using the multi-step form. Ensure all necessary information is captured accurately.
              </p>
              {/* Steps Illustration */}
              <div className="mt-4">
                <img src="/images/add-patient-form.png" alt="Add Patient Form" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Step 1: Basic Information:</strong> Enter the patient’s full name, age, and gender.
                </li>
                <li>
                  <strong>Step 2: Contact Details:</strong> Provide the patient’s mobile number, email, and address.
                </li>
                <li>
                  <strong>Step 3: Medical Information:</strong> Record the patient’s disease or condition and any additional notes.
                </li>
                <li>
                  <strong>Step 4: Credential Generation:</strong> The system generates a unique username and password for the patient, which can be emailed directly to them.
                </li>
              </ol>
            </motion.div>

            {/* Viewing and Editing Patient Information */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-orange-700">Viewing and Editing Patient Information</h3>
              <p className="text-lg text-gray-600">
                Access comprehensive patient profiles, view visit histories, and update information as needed to maintain accurate records.
              </p>
              {/* Screenshot */}
              <div className="mt-4">
                <img src="/images/patient-profile.png" alt="Patient Profile" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Search Patient:</strong> Use the "Search Patient" feature to locate a specific patient by name, address, or visit date.
                </li>
                <li>
                  <strong>View Profile:</strong> Click on "View Details" to access the patient’s full profile, including contact information and medical history.
                </li>
                <li>
                  <strong>Edit Information:</strong> Update patient details by clicking the "Edit" button within the profile section.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* Appointments and Visits */}
        <Section
          id="appointments-and-visits"
          title="Appointments and Visits"
          icon={<FaCalendarAlt className="text-4xl text-purple-500 mr-4" />}
          background="from-purple-200 to-purple-300"
        >
          <div className="space-y-6">
            {/* Scheduling Appointments */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-purple-700">Scheduling Appointments</h3>
              <p className="text-lg text-gray-600">
                Schedule new appointments seamlessly using the intuitive "Add Visit" form. Manage your daily, weekly, and monthly schedules efficiently.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/schedule-appointment.png" alt="Schedule Appointment" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Select Patient:</strong> Choose the patient from your list or add a new one directly from the scheduling form.
                </li>
                <li>
                  <strong>Enter Visit Details:</strong> Input symptoms, reasons for the visit, and any prescribed medicines with specific timings.
                </li>
                <li>
                  <strong>Set Treatment Status:</strong> Update the treatment status to "Ongoing," "Completed," or "Stopped."
                </li>
                <li>
                  <strong>Financial Information:</strong> Enter the total amount and the amount paid for the visit. The system will automatically calculate the remaining balance.
                </li>
                <li>
                  <strong>Schedule Next Visit:</strong> Optionally, set the date and time for the patient's next appointment.
                </li>
              </ol>
            </motion.div>

            {/* Managing Missed Appointments */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-purple-700">Managing Missed Appointments</h3>
              <p className="text-lg text-gray-600">
                The app automatically flags missed appointments and allows you to reschedule them with ease.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/missed-appointments.png" alt="Missed Appointments" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Automatic Status Updates:</strong> The system checks appointment times in real-time and updates their statuses to "Missed" if they haven't been marked as completed.
                </li>
                <li>
                  <strong>Highlighting Missed Appointments:</strong> Missed appointments are highlighted with a distinctive background color to alert you.
                </li>
                <li>
                  <strong>Rescheduling:</strong> Click on the "Reschedule" button on a missed appointment to set a new date and time directly within the appointment card.
                </li>
                <li>
                  <strong>Validation:</strong> Ensure that you provide a valid date and time. The system will prompt you if any required fields are missing.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* Treatment Management */}
        <Section
          id="treatment-management"
          title="Treatment Management"
          icon={<FaUserShield className="text-4xl text-green-500 mr-4" />}
          background="from-green-200 to-green-300"
        >
          <div className="space-y-6">
            {/* Ongoing Patients */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-green-700">Ongoing Patients</h3>
              <p className="text-lg text-gray-600">
                View and manage patients who are currently undergoing treatment. Update their treatment statuses as needed.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/ongoing-patients.png" alt="Ongoing Patients" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>View Ongoing Treatments:</strong> Access a list of all patients with treatments marked as "Ongoing."
                </li>
                <li>
                  <strong>Search Functionality:</strong> Use the search bar to quickly locate specific patients by name.
                </li>
                <li>
                  <strong>Update Treatment Status:</strong> Mark treatments as "Completed" or "Stopped" directly from the patient card. A confirmation modal ensures intentional actions.
                </li>
                <li>
                  <strong>Loading Indicators:</strong> Visual feedback is provided when updating treatment statuses to enhance user experience.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* Financial Management */}
        <Section
          id="financial-management"
          title="Financial Management"
          icon={<FaMoneyCheckAlt className="text-4xl text-yellow-500 mr-4" />}
          background="from-yellow-200 to-yellow-300"
        >
          <div className="space-y-6">
            {/* Tracking Outstanding Balances */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-yellow-700">Tracking Outstanding Balances</h3>
              <p className="text-lg text-gray-600">
                Easily monitor and manage patient balances to ensure timely payments and financial health of your clinic.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/patient-balance.png" alt="Patient Balance" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>View Outstanding Balances:</strong> Navigate to the "Patients with Balance" section to see a list of patients who have unpaid amounts.
                </li>
                <li>
                  <strong>Detailed Breakdown:</strong> Each patient card includes a detailed breakdown of outstanding visits and the amounts owed.
                </li>
                <li>
                  <strong>Search Functionality:</strong> Use the search bar to locate specific patients by name, making it easier to manage large lists.
                </li>
                <li>
                  <strong>Visual Indicators:</strong> Outstanding balances are highlighted with distinctive colors and icons for quick identification.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* Profile and Account Settings */}
        <Section
          id="profile-and-account-settings"
          title="Profile and Account Settings"
          icon={<FaUserShield className="text-4xl text-green-500 mr-4" />}
          background="from-green-200 to-green-300"
        >
          <div className="space-y-6">
            {/* Updating Profile Information */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-green-700">Updating Profile Information</h3>
              <p className="text-lg text-gray-600">
                Keep your personal and clinic information up-to-date to ensure seamless operations and accurate records.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/update-profile.png" alt="Update Profile" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Access Profile Settings:</strong> Click on "Update Profile" from the sidebar to navigate to your account settings.
                </li>
                <li>
                  <strong>Edit Information:</strong> Update your name, clinic name, location, and other personal details as needed.
                </li>
                <li>
                  <strong>Save Changes:</strong> After making the necessary updates, click "Save" to apply the changes securely.
                </li>
                <li>
                  <strong>Change Password:</strong> Navigate to the "Change Password" section within the profile settings to update your password. Ensure your new password meets the security requirements.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* Data Security and Privacy */}
        <Section
          id="data-security-and-privacy"
          title="Data Security and Privacy"
          icon={<FaShieldAlt className="text-4xl text-blue-500 mr-4" />}
          background="from-blue-200 to-blue-300"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-blue-700">Data Security and Privacy</h3>
              <p className="text-lg text-gray-600">
                ClinicEase employs robust security measures to protect sensitive patient and clinic data, ensuring compliance with industry standards.
              </p>
              {/* Illustration */}
              <div className="mt-4">
                <img src="/images/data-security.png" alt="Data Security" className="w-full max-w-lg rounded-lg shadow-lg" />
              </div>
              {/* Description */}
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 mt-6">
                <li>
                  <strong>Data Encryption:</strong> All sensitive data, including patient information and financial details, are encrypted using industry-standard encryption methods.
                </li>
                <li>
                  <strong>Access Control:</strong> Access to patient data is restricted to authorized personnel only. Role-based access ensures that users can only view and modify data pertinent to their roles.
                </li>
                <li>
                  <strong>Compliance:</strong> ClinicEase adheres to data privacy regulations such as HIPAA, ensuring that patient data is handled with the utmost care and confidentiality.
                </li>
                <li>
                  <strong>Regular Audits:</strong> The system undergoes regular security audits and updates to address potential vulnerabilities and enhance data protection measures.
                </li>
              </ol>
            </motion.div>
          </div>
        </Section>

        {/* FAQ Section */}
        <FAQ data={faqData} />

        {/* Support Section */}
        <Support />

        {/* Conclusion Section */}
        <Section
          id="conclusion"
          // title="Conclusion"
          // icon={<FaClinicMedical className="text-4xl text-indigo-500 mr-4" />}
          background="from-indigo-200 to-indigo-300"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              {/* <h3 className="text-2xl font-semibold mb-4 text-indigo-700">Conclusion</h3> */}
              <p className="text-lg text-gray-600">
                Thank you for choosing ClinicEase to streamline your clinic operations. We are committed to providing you with the best tools to manage your patients, appointments, treatments, and finances efficiently and securely.
              </p>
              {/* Call to Action */}
              <div className="mt-8">
                <motion.a
                  href="#getting-started"
                  className="inline-block bg-indigo-500 text-white py-3 px-6 rounded-full text-lg font-medium shadow-lg hover:bg-indigo-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Get Started Now
                </motion.a>
              </div>
            </motion.div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserGuide;
