
import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { db } from '../../db';
import { collection, onSnapshot } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  TimeScale
);

const StatsChart = () => {
  const { data: session } = useSession();
  const [patientData, setPatientData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);

  useEffect(() => {
    if (session && session.user) {
      fetchPatientData();
      fetchAppointmentData();
    }
  }, [session]);

  const fetchPatientData = () => {
    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    onSnapshot(patientsRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        const patient = doc.data();
        const createdAt = patient.createdAt ? patient.createdAt.toDate() : new Date();
        data.push({
          id: doc.id,
          createdAt,
        });
      });
      setPatientData(data);
    });
  };

  const fetchAppointmentData = () => {
    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    onSnapshot(patientsRef, (patientsSnapshot) => {
      const appointmentDates = [];
      patientsSnapshot.forEach((patientDoc) => {
        const patientId = patientDoc.id;
        const visitsRef = collection(
          db,
          'doctors',
          doctorId,
          'patients',
          patientId,
          'visits'
        );

        onSnapshot(visitsRef, (visitsSnapshot) => {
          visitsSnapshot.forEach((visitDoc) => {
            const visit = visitDoc.data();
            const nextVisitDateStr = decryptData(visit.nextVisitDate);
            const treatmentStatus = decryptData(visit.treatmentStatus || '');

            if (nextVisitDateStr) {
              const nextVisitDate = new Date(nextVisitDateStr);
              appointmentDates.push({
                date: nextVisitDate,
                status: treatmentStatus,
              });
            }
          });
          setAppointmentData(appointmentDates);
        });
      });
    });
  };

  // Prepare data for charts
  const patientChartData = preparePatientChartData(patientData);
  const appointmentChartData = prepareAppointmentChartData(appointmentData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h3 className="text-xl font-bold mb-4">New Patients Over Time</h3>
        <div style={{ height: '300px' }}>
          <Line data={patientChartData} options={lineChartOptions} />
        </div>
      </motion.div>
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h3 className="text-xl font-bold mb-4">Upcoming Appointments</h3>
        <div style={{ height: '300px' }}>
          <Bar data={appointmentChartData} options={barChartOptions} />
        </div>
      </motion.div>
    </div>
  );
};

const preparePatientChartData = (patientData) => {
  const counts = {};
  patientData.forEach((patient) => {
    const month = patient.createdAt.toLocaleString('default', {
      month: 'short',
      year: 'numeric',
    });
    counts[month] = (counts[month] || 0) + 1;
  });

  const labels = Object.keys(counts).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const dataPoints = labels.map((label) => counts[label]);

  return {
    labels,
    datasets: [
      {
        label: 'New Patients',
        data: dataPoints,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        tension: 0.4,
      },
    ],
  };
};

const prepareAppointmentChartData = (appointmentData) => {
  const counts = {};
  appointmentData.forEach((appt) => {
    const day = appt.date.toLocaleDateString();
    counts[day] = counts[day] || { completed: 0, pending: 0 };

    if (appt.status === 'Completed') {
      counts[day].completed += 1;
    } else {
      counts[day].pending += 1;
    }
  });

  const labels = Object.keys(counts).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const completedData = labels.map((label) => counts[label].completed);
  const pendingData = labels.map((label) => counts[label].pending);

  return {
    labels,
    datasets: [
      {
        label: 'Completed Appointments',
        data: completedData,
        backgroundColor: '#4ade80', // Green
      },
      {
        label: 'Pending Appointments',
        data: pendingData,
        backgroundColor: '#facc15', // Yellow
      },
    ],
  };
};

const lineChartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
};

const barChartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
    },
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10,
      },
    },
  },
};

export default StatsChart;
