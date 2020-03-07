/**
 * @description: màn hình đăng nhập người dùng
 * @author: duynn
 * @since: 04/05/2018
 */
'use strict'
import React, { Component } from 'react'
import {
    AsyncStorage, View, ScrollView, Text, TextInput, Keyboard, Animated, Image, ImageBackground,
    TouchableOpacity, StatusBar
} from 'react-native'

//lib
import { Container } from 'native-base';
//constants
import { EMPTY_STRING, Colors, APPLICATION_FULL_NAME, APPLICATION_SHORT_NAME } from '../../../common/SystemConstant';

//styles
import { LoginStyle } from '../../../assets/styles/LoginStyle';
import { moderateScale } from '../../../assets/styles/ScaleIndicator';

import { authenticateLoading } from '../../../common/Effect';
import { showWarningToast } from '../../../common/Utilities'

//redux
import { connect } from 'react-redux';
import * as userAction from '../../../redux/modules/User/Action';

//react-native-firebase
import firebase from 'react-native-firebase';

import { accountApi } from '../../../common/Api';
import images from '../../../common/Images';

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userName: EMPTY_STRING,
            password: EMPTY_STRING,

            headerAnimation: new Animated.Value(2),
            footerAnimation: 'flex',
            headerComponentsDisplayStatus: 'flex',

            isDisabledLoginButton: true,
            isRememberPassword: false,
            isHidePassword: true,
            passwordIconDisplayStatus: 'none',

            loading: false
        }

        this._keyboardDidShow = this._keyboardDidShow.bind(this);
        this._keyboardDidHide = this._keyboardDidHide.bind(this);
    }

    componentWillMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
    }
    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    _keyboardDidShow() {
        this.setState({
            footerAnimation: 'none',
            headerComponentsDisplayStatus: 'none'
        }, () => {
            Animated.spring(this.state.headerAnimation, {
                toValue: 0
            }).start();
        });
    }

    _keyboardDidHide() {
        this.setState({
            footerAnimation: 'flex',
            headerComponentsDisplayStatus: 'flex'
        }, () => {
            Animated.spring(this.state.headerAnimation, {
                toValue: 2
            }).start();
        });
    }

    onRememberPassword() {
        this.setState({
            isRememberPassword: !this.state.isRememberPassword
        })
    }

    onChangeUserNameText(userName) {
        this.setState({
            userName
        }, () => {
            this.setState({
                isDisabledLoginButton: (userName.length <= 0 || this.state.password.length <= 0)
            });
        });
    }

    onChangePasswordText(password) {
        if (password.length > 0) {
            this.setState({
                password,
                passwordIconDisplayStatus: 'flex'
            }, () => {
                if (this.state.userName.length > 0) {
                    this.setState({
                        isDisabledLoginButton: false
                    })
                }
            });
        } else {
            this.setState({
                isHidePassword: true,
                password,
                passwordIconDisplayStatus: 'none'
            }, () => {
                this.setState({
                    isDisabledLoginButton: true
                })
            })
        }
    }

    onChangePasswordVisibility() {
        //show and hide password
        this.setState({
            isHidePassword: !this.state.isHidePassword
        });
    }

    async onLogin() {
        try {
            Keyboard.dismiss();
            //lấy fcm token
            let deviceToken = await AsyncStorage.getItem('deviceToken');

            if (!deviceToken) {
                deviceToken = await firebase.messaging().getToken();
                if (deviceToken) {
                    await AsyncStorage.setItem('deviceToken', deviceToken);
                }
            }
            this.setState({
                loading: true
            });

            const resultJson = await accountApi().postLogin({
                UserName: this.state.userName,
                Password: this.state.password,
                DeviceToken: deviceToken
            });

            if (resultJson != null) {
                if (resultJson.hasOwnProperty("Message")) {
                    this.setState({
                        loading: false
                    }, () => {
                        showWarningToast('Lỗi máy chủ!');
                    });
                }
                else {
                    AsyncStorage.setItem('userInfo', JSON.stringify(resultJson)).then(() => {
                        this.props.setUserInfo(resultJson);
                        this.props.navigation.navigate('LoadingScreen');
                    });
                }
            }
            else {
                this.setState({
                    loading: false
                }, () => {
                    showWarningToast('Thông tin đăng nhập không chính xác!');
                });
            }
        } catch (error) {
            //TODO: call api to send Error to server
            showWarningToast(error);
        }

    }

    onSignupPress = () => {
        this.props.navigation.navigate('SignupScreen');
    }

    _handleEditing = () => {
        this.passwordInput && this.passwordInput.focus();
    }

    render() {
        const { userName, password } = this.state;
        const toggleLoginStyleButton = (userName !== EMPTY_STRING && password !== EMPTY_STRING) ? { backgroundColor: Colors.LITE_BLUE } : { backgroundColor: 'lightgrey' };
        const toggleLoginStyleText = (userName !== EMPTY_STRING && password !== EMPTY_STRING) ? { color: 'white' } : { color: 'grey' };
        return (
            <ImageBackground source={images.background} style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" />
                <Container>
                    <Animated.View style={[
                        {
                            flex: this.state.headerAnimation
                        },
                        LoginStyle.formHeader
                    ]}>

                        <Text style={[LoginStyle.formHeaderSoftwareTitle, { display: this.state.headerComponentsDisplayStatus }]}>
                            {APPLICATION_FULL_NAME}
                        </Text>

                        <Text style={[LoginStyle.formHeaderSoftwareName, { display: this.state.headerComponentsDisplayStatus }]}>
                            {APPLICATION_SHORT_NAME}
                        </Text>
                    </Animated.View>
                    <ImageBackground source={images.ribbonBackground} style={LoginStyle.formContainerImageBackground}>
                        <ScrollView style={LoginStyle.formContainer}>
                            <View style={LoginStyle.formTitle}>
                                <Text style={LoginStyle.formTitleText}>
                                    ĐĂNG NHẬP HỆ THỐNG
                                </Text>
                            </View>

                            <View style={LoginStyle.formInputs}>
                                <View style={LoginStyle.formLabel}>
                                    <Text style={LoginStyle.formLabelText}>
                                        Tên đăng nhập
                                    </Text>
                                </View>
                                <View style={LoginStyle.formInput}>
                                    <TextInput
                                        onChangeText={(userName) => this.onChangeUserNameText(userName)}
                                        value={this.state.userName}
                                        style={LoginStyle.formInputText}
                                        underlineColorAndroid={'#f7f7f7'}
                                        returnKeyType='next'
                                        returnKeyLabel='Tiếp'
                                        onSubmitEditing={this._handleEditing}
                                    />
                                </View>

                                <View style={LoginStyle.formLabel}>
                                    <Text style={LoginStyle.formLabelText}>
                                        Mật khẩu
                                    </Text>
                                </View>
                                <View style={LoginStyle.formInput}>
                                    <TextInput
                                        value={this.state.password}
                                        onChangeText={(password) => this.onChangePasswordText(password)}
                                        secureTextEntry={this.state.isHidePassword}
                                        style={LoginStyle.formInputText}
                                        underlineColorAndroid={'#f7f7f7'}
                                        returnKeyType='done'
                                        returnKeyLabel='Xong'
                                        ref={ref => this.passwordInput = ref}
                                        textContentType="password"
                                        onSubmitEditing={() => this.onLogin()}
                                    />
                                    <TouchableOpacity onPress={this.onChangePasswordVisibility.bind(this)} style={LoginStyle.formPasswordVisibility}>
                                        <Image source={(this.state.isHidePassword) ? images.showPasswordIcon : images.hidePasswordIcon}
                                            style={{ display: this.state.passwordIconDisplayStatus }} />
                                    </TouchableOpacity>

                                </View>
                            </View>
                            <View style={LoginStyle.formNotes}></View>
                            <View style={[LoginStyle.formInputs, LoginStyle.formButton]}>
                                <TouchableOpacity
                                    disabled={this.state.isDisabledLoginButton}
                                    onPress={() => this.onLogin()}
                                    style={[LoginStyle.formButtonLogin, toggleLoginStyleButton]}
                                >
                                    <Text style={[LoginStyle.formButtonText, toggleLoginStyleText]}>ĐĂNG NHẬP</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={this.onSignupPress}
                                style={[LoginStyle.formInputs, LoginStyle.formButton]}
                            >
                                <Text style={[LoginStyle.formButtonText, { color: Colors.GRAY, fontSize: moderateScale(16, 1.2) }]}>Chưa có tài khoản?</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </ImageBackground>
                    {
                        //<Animated.View style={[LoginStyle.formFooter, { display: this.state.footerAnimation }]}></Animated.View>
                    }

                    {
                        authenticateLoading(this.state.loading)
                    }
                </Container>
            </ImageBackground>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setUserInfo: (data) => dispatch(userAction.setUserInfo(data))
    }
}

export default connect(null, mapDispatchToProps)(Login);