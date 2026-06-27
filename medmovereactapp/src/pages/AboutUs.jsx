import React from 'react';
import Navbar from '../Components/Home/Navbar/Navbar';
import Footer from '../Components/Home/Footer/Footer';
import Testimonials from '../Components/Home/Testimonials/Testimonials';
import Mission from '../Components/Home/Mission/Mission';
import WhyMedMove from '../Components/Home/WhyMedMove/WhyMedMove';
import CoreValues from '../Components/Home/CoreValues/CoreValues';

const AboutUs = () => {
    return (
        <div className="about-page" style={{ backgroundColor: '#0A1A2F' }}>
            <Navbar />
            <Mission />
            <CoreValues />
            <WhyMedMove />
            <Testimonials />
            <Footer />
        </div>
    );
};

export default AboutUs;
