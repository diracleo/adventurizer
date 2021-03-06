import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Util from './../../Util.js';
import config from 'react-global-configuration';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

import Footer from './../modules/Footer.js';
import MyProgressList from './../modules/MyProgressList.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class MyProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      adventures: [],
      status: {
        loading: true
      }
    }
    this.props.dispatch(setViewType("normal"));
  }
  render() {
    return (
      <div className="wrappedOuter">
        <div className="wrapped">
          <div className="mainTitle">
            <h1>My Progress</h1>
          </div>
          <div className="content contentFilled contentWithTitle">
            <MyProgressList pagination={true} limit={12} />
          </div>
        </div>
        <Footer type="padded" />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(MyProgress);