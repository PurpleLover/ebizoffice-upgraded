import * as FireBaseConstant from './FireBaseConstant';
import _ from 'lodash';
import { Alert } from 'react-native';

const FCM_API_URL = "https://fcm.googleapis.com/fcm/send";

import { API_URL } from '../common/SystemConstant';
import firebase from 'react-native-firebase';

async function pushFirebaseNotify(content, targetToken, type) {
    if (_.isNull(FireBaseConstant.SERVER_KEY) || _.isEmpty(FireBaseConstant.SERVER_KEY)) {
        Alert.alert(
            'THÔNG BÁO',
            'Không thể gửi kết nối đến server',
            [
                { text: 'OK', onPress: () => { } }
            ]
        )
        return;
    }
    //for android only
    let body = JSON.stringify({
        to: targetToken,
        notification: {
            title: content.title,
            body: content.message,
        },
        data: {
            targetScreen: content.targetScreen,
            objId: content.objId,
            isTaskNotification: content.isTaskNotification
        },
        priority: 'high'
    });

    const headers = new Headers({
        "Content-Type": "application/json",
        "Authorization": "key=" + FireBaseConstant.SERVER_KEY
    });
    
    const fcmResult = await fetch(FCM_API_URL, {
        method: 'POST',
        headers,
        body
    }).then(response => response.json())
    .then(responseJSON => {
        return responseJSON;
    });

    if(fcmResult && fcmResult.success){
        console.log('FCM result', 'GỬI THÔNG BÁO THÀNH CÔNG');
    }else{
        saveFirebaseMessageToDb(content);
    }
}


async function saveFirebaseMessageToDb(content){
    const url = `${API_URL}/api/HscvCongViec/SaveFcmMessageToDb`;
    const fcmDbResult = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            TIEUDE: content.title,
            NOIDUNG: content.message
        })
    });

    const fcmDbResultJSON = await fcmDbResult.json();

    console.log('kết quả', fcmDbResultJSON);
}

export {
    pushFirebaseNotify
}