import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { withRouter } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

import SearchList from './../modules/SearchList.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class Search extends React.Component {
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
          <h1>Explore Adventures</h1>
        </div>
        <div className="content contentFilled contentWithTitle">
          <SearchList pagination={true} sort={this.props.sort} page={this.props.page} limit={12} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default withRouter(connect(mapStateToProps)(Search));