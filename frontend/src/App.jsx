import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PurchasesPage from './pages/PurchasesPage';
import TransfersPage from './pages/TransfersPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/purchases" element={
            <PrivateRoute>
              <Layout>
                <PurchasesPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/transfers" element={
            <PrivateRoute>
              <Layout>
                <TransfersPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/assignments" element={
            <PrivateRoute>
              <Layout>
                <AssignmentsPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </PrivateRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
