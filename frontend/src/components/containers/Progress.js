import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Util from './../../Util.js';
import config from 'react-global-configuration';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

import ProgressList from './../modules/ProgressList.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class Progress extends React.Component {
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
      <div>
        <div className="mainTitle">
          <h1>My Progress</h1>
          <p>Track the adventures you've taken!</p>
        </div>
        <div className="content contentFilled contentWithTitle">
          <ProgressList pagination={true} limit={12} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(Progress);