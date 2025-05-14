import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sign from './pages/Sign'
import Home from './pages/Home';
import Login from './pages/Login'
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Editpage from './pages/Editpage';
import ProtectedRoute from './ProtectedRoute';
import Other_profile from './pages/Other_profile';
import Subscription from './pages/Subscription';
import Verify from './pages/Verify';
import { Toaster } from 'react-hot-toast'
import { useTranslation } from "react-i18next";
import Notifications from './pages/Notfication';
import { useEffect } from 'react';



function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem("Language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <>
    <BrowserRouter>
    <Notifications />
    <Toaster />
    <div>
       
        <Routes>
        <Route path="/" element={<Verify/>} />
          <Route path="/sign" element={<Sign />} />
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/login' element={<Login />}/>
          <Route path='/explore' element={<ProtectedRoute><Explore /></ProtectedRoute>}/>
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>}/>
          <Route path='/edit' element={<ProtectedRoute><Editpage /></ProtectedRoute>}/>
          <Route path='/:id' element={< Other_profile/>}/>
          <Route path='/subscribe' element={< Subscription/>}/>
        </Routes>
      
    </div>
    </BrowserRouter>

    </>
  )
}

export default App
