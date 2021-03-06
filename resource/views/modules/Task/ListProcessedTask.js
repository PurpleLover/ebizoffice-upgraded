/**
 * @description: danh sách công việc cá nhân
 * @author: duynn
 * @since: 10/05/2018
 */
'use strict'
import React, { Component } from 'react';
import BaseTaskList from './BaseTaskList';

//constant
import { CONGVIEC_CONSTANT } from '../../../common/SystemConstant';

export default class ListProcessedTask extends Component {
  render() {
    return (
      <BaseTaskList taskType={CONGVIEC_CONSTANT.DAGIAO_XULY} navigator={this.props.navigation} />
    )
  }
}