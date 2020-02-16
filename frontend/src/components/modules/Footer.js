import React from 'react';
import { Link } from "react-router-dom";

import Util from './../../Util.js';

const Footer = () => (
  <div className="footer">
    <div>
      Copyright 2020 Adventurizer
      <br/>
      <Link target={"_blank"} to={'/terms'}>Terms of Use</Link> &nbsp; | &nbsp; <Link target={"_blank"} to={'/privacy'}>Privacy Policy</Link>
    </div>
  </div>
)

export default Footer;