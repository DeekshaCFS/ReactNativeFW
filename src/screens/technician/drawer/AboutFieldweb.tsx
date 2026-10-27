// src/screens/technician/drawer/AboutFieldweb.tsx
import React from 'react';
import WebPageFrame from '../../../components/WebPageFrame';

const ABOUT_URL = 'https://www.thefieldweb.com/about-us'; // Java: AboutUsFragment

export default function AboutFieldwebScreen() {
  return <WebPageFrame uri={ABOUT_URL} />;
}
