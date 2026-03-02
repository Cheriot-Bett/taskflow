import Sidebar from './Sidebar';
import ToastContainer from './Toast';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
