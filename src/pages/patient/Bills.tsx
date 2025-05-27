import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Link } from 'react-router-dom';
import '../../styles/bills.css';

// Let's add the missing bill service functions
interface Bill {
  id: number;
  invoice_number: string;
  patient_id: number;
  issue_date: string;
  due_date: string;
  total_amount: number;
  balance_due: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  items?: BillItem[];
}

interface BillItem {
  id: number;
  bill_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  name: string;
}

const BillsList: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const paymentMethods: PaymentMethod[] = [
    { id: 'credit_card', name: 'Credit Card' },
    { id: 'debit_card', name: 'Debit Card' },
    { id: 'insurance', name: 'Insurance' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
  ];

  useEffect(() => {
    const fetchBills = async () => {
      try {
        // This will need to be implemented in patientService
        const response = await fetch('/api/patients/bills/');
        const data = await response.json();
        setBills(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bills:', err);
        setError('Failed to load bills. Please try again later.');
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const handlePaymentClick = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.balance_due.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setProcessingPayment(true);
    try {
      // This will need to be implemented in patientService
      const response = await fetch(`/api/patients/bills/${selectedBill.id}/make-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const updatedBill = await response.json();
      
      // Update the bills list with the new data
      setBills(bills.map(bill => 
        bill.id === selectedBill.id ? updatedBill : bill
      ));
      
      setSuccessMessage('Payment processed successfully!');
      setShowPaymentModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout title="My Bills">
      <div className="bills-container">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="bills-header">
          <h2>Manage Your Medical Bills</h2>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="no-bills">
            <p>You don't have any bills at the moment.</p>
          </div>
        ) : (
          <div className="bills-list">
            {bills.map(bill => (
              <div className={`bill-card ${bill.status.toLowerCase()}`} key={bill.id}>
                <div className="bill-header">
                  <h3>Invoice #{bill.invoice_number}</h3>
                  <span className={`status-badge ${bill.status.toLowerCase()}`}>
                    {bill.status}
                  </span>
                </div>
                
                <div className="bill-details">
                  <div className="bill-info">
                    <p><strong>Issue Date:</strong> {formatDate(bill.issue_date)}</p>
                    <p><strong>Due Date:</strong> {formatDate(bill.due_date)}</p>
                  </div>
                  
                  <div className="bill-amounts">
                    <p><strong>Total Amount:</strong> {formatCurrency(bill.total_amount)}</p>
                    <p><strong>Balance Due:</strong> {formatCurrency(bill.balance_due)}</p>
                  </div>
                </div>
                
                <div className="bill-actions">
                  <Link to={`/patient/bills/${bill.id}`} className="view-details-button">
                    View Details
                  </Link>
                  
                  {bill.status !== 'PAID' && (
                    <button 
                      className="pay-bill-button"
                      onClick={() => handlePaymentClick(bill)}
                    >
                      Make Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showPaymentModal && selectedBill && (
          <div className="payment-modal-overlay">
            <div className="payment-modal">
              <div className="payment-modal-header">
                <h3>Make Payment</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowPaymentModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="payment-details">
                <p><strong>Invoice:</strong> #{selectedBill.invoice_number}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(selectedBill.total_amount)}</p>
                <p><strong>Balance Due:</strong> {formatCurrency(selectedBill.balance_due)}</p>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-group">
                  <label htmlFor="paymentAmount">Payment Amount</label>
                  <div className="input-with-prefix">
                    <span className="currency-prefix">$</span>
                    <input
                      type="number"
                      id="paymentAmount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0.01"
                      max={selectedBill.balance_due}
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="payment-actions">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="pay-button"
                    disabled={processingPayment}
                  >
                    {processingPayment ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BillsList;
