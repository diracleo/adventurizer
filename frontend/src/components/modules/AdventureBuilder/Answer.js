import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { sortableHandle } from 'react-sortable-hoc';
import { IconButton, TextField, InputAdornment, Fab } from '@material-ui/core';
import { DragHandle, Delete as DeleteIcon, Link as LinkIcon } from '@material-ui/icons';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../../action";

import Util from './../../../Util.js';
import config from 'react-global-configuration';

class Answer extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }
  handleDelete() {
    let o = this;
    o.props.dispatch(setConfirmDialog({
      "title": "Delete this answer?",
      "description": "This action cannot be undone.",
      "open": true,
      "confirmCallback": function() {
        o.props.set(o.props.index, null);
      }
    }));
  }
  handleTextUpdate(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params);
  }
  handleTextSubmit(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params);
  }
  startLink(e) {
    let params = {};
    params['from'] = this.props.questionIndex + "," + this.props.index;
    params['preview'] = true;
    this.props.setLink(params);
  }
  componentDidUpdate() {
    let params = Object.assign({}, this.props.params);
    if(params['element'] == null) {
      params['element'] = this.myRef.current;
      this.props.set(this.props.index, params);
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.params.element == null || !isEqual(this.props.params, nextProps.params);
  }
  render() {
    let color = this.props.params.linkedTo != null ? "secondary" : "primary";
    let classNames = "answerInput";
    if(this.props.params.linkedTo != null) {
      //classNames += " linked"
    }
    let SortHandle = sortableHandle(() => 
      <IconButton
        className="handle" 
        edge="start"
        size="small">
        <DragHandle />
      </IconButton>
    );
    return (
      <div>
        <TextField
          autoFocus={this.props.params.focused}
          className={classNames}
          size="small"
          color={color}
          multiline
          fullWidth
          onChange={(event) => this.handleTextUpdate(event)}
          onBlur={(event) => this.handleTextSubmit(event)}
          value={this.props.params.text}
          placeholder="Choice"
          InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <SortHandle />
              </InputAdornment>,
            endAdornment:
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => this.handleDelete()}
                >
                  <DeleteIcon />
                </IconButton>
                <Fab
                  edge="end"
                  size="small"
                  color={color}
                  onClick={(event) => this.startLink(event)}
                >
                  <LinkIcon />
                  <div ref={this.myRef} className="answerPoint"></div>
                </Fab>
              </InputAdornment>
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(Answer);