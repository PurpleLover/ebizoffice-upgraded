/**
 * @description: toàn bộ reducer của hệ thống
 * @author: duynn
 * @since: 06/05/2018
 */

import { combineReducers } from 'redux';

import userReducer from '../modules/User/Reducer';
import vanbandiReducer from '../modules/VanBanDi/Reducer';
import vanbandenReducer from '../modules/VanBanDen/Reducer';
import networkReducer from '../modules/network/Reducer';
import workflowReducer from '../modules/Workflow/Reducer';
import taskReducer from '../modules/CongViec/Reducer';
import authorizeReducer from '../modules/UyQuyen/Reducer';
import navReducer from '../modules/Nav/Reducer';

export const globalReducer = combineReducers({
    userState: userReducer,
    vanbandiState: vanbandiReducer,
    vanbandenState: vanbandenReducer,
    networkState: networkReducer,
    workflowState: workflowReducer,
    taskState: taskReducer,
    authorizeState: authorizeReducer,
    navState: navReducer,
});