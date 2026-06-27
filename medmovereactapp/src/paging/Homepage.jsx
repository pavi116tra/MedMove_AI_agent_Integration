import React from 'react'
import Navbar from '../Components/Home/Navbar/Navbar'
import First from '../Components/Home/First/First'
import Firstdetail from '../Components/Home/Firstdetail/Firstdetail'
import Third from '../Components/Home/Third/Third'
import Fivth from '../Components/Home/Fivth/Fivth'
import Sixth from '../Components/Home/Sixth/Sixth'
import Seven from '../Components/Home/Seven/Seven'
import Eight from '../Components/Home/Eight/Eight';
import Testimonials from '../Components/Home/Testimonials/Testimonials';
import Footer from '../Components/Home/Footer/Footer';

const Homepage = () => {
  return (
    <>
      <Navbar/>
      <First/>
      <Firstdetail/>
      <Third/>
      <Fivth/>
      <Sixth/>
      <Seven/>
      <Eight/>
      <Testimonials />
      <Footer/>
    </>
  )
}

export default Homepage
