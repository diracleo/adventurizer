import React from 'react';
import { Link } from "react-router-dom";

import Util from './../../Util.js';

function Footer(props) {
  let cName = "footer"
  if(typeof(props.type) != 'undefined') {
    cName += " " + props.type;
  }
  return (
    <div className={cName}>
      <div>
        Copyright 2020 Adventurizer
        <br/>
        <Link target={"_blank"} to={'/terms'}>Terms of Use</Link> &nbsp; <span>|</span> &nbsp; <Link target={"_blank"} to={'/privacy'}>Privacy Policy</Link>
      </div>
    </div>
  )
}

export default Footer;