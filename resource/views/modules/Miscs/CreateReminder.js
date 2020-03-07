/*
	@description: tạo công việc con
	@author: duynn
	@since: 19/05/2018
*/
'use strict'
import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
//lib
import {
  Container, Header, Left, Body, Right, Item, Title, Text, Icon, Input,
  Form, Picker, Toast, Label} from 'native-base'
import DatePicker from 'react-native-datepicker';
import 'moment/locale/vi';

//utilities
import { EMPTY_STRING, Colors, TOAST_DURATION_TIMEOUT } from '../../../common/SystemConstant';
import { verticalScale } from '../../../assets/styles/ScaleIndicator';
import { executeLoading, dataLoading } from '../../../common/Effect';
import { pickerFormat, showWarningToast } from '../../../common/Utilities';

//redux
import { connect } from 'react-redux';
import * as navAction from '../../../redux/modules/Nav/Action';

import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
import AccountStyle from '../../../assets/styles/AccountStyle';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { reminderApi } from '../../../common/Api';
import { DatePickerCustomStyle, CustomStylesDatepicker } from '../../../assets/styles';
import { HeaderRightButton, CustomPickerButton, GoBackButton } from '../../common';

const ReminderApi = reminderApi();

class CreateReminder extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: props.userInfo.ID,
      noidung: EMPTY_STRING,
      ngay: EMPTY_STRING,
      gio: EMPTY_STRING,
      phut: EMPTY_STRING,
      period: EMPTY_STRING,

      thoigian: EMPTY_STRING,
      listPeriod: [],
      executing: false,
      focusId: EMPTY_STRING,
      fromScreen: props.extendsNavParams.originScreen || EMPTY_STRING,
      loading: false,
      giamdocId: props.extendsNavParams.chutriName || 0,
      giamdocName: props.extendsNavParams.giamdocName || EMPTY_STRING,

      isSaveBtnPressed: true,
      isSaveIcoPressed: true,
      isThuky: false,
    }
  }

  handleChange = fieldName => fieldValue => this.setState({ [fieldName]: fieldValue })

  navigateBack = () => {
    this.props.navigation.goBack();
  }

  componentWillMount = () => {
    this.fetchData();
  }
  componentDidMount = () => {
    this.willFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.extendsNavParams.hasOwnProperty("giamdocId")) {
        if (this.props.extendsNavParams.giamdocId > 0) {
          this.setState({
            giamdocId: this.props.extendsNavParams.giamdocId,
            giamdocName: this.props.extendsNavParams.giamdocName
          });
        }
      }
    });
  }

  fetchData = async () => {
    this.setState({
      loading: true
    });

    const resultJson = await ReminderApi.getCreateHelper([
      this.state.userId
    ]);

    this.setState({
      loading: false,
      period: resultJson != null ? `${resultJson.Params.DefaultPeriod}` : EMPTY_STRING,
      listPeriod: resultJson != null ? resultJson.Params.ListPeriod : [],
      isThuky: resultJson != null ? resultJson.Params.isThuky : false
    });
  }

  // navigateToVanbanLienquan = (screenName = "") => {
  //   const targetScreenParam = {
  //     docId: this.state.docId,
  //     docType: this.state.docType
  //   };
  //   this.onNavigate(screenName, targetScreenParam);
  // }

  saveReminder = async () => {
    this.setState({
      isSaveBtnPressed: false,
      isSaveIcoPressed: false
    });
    const {
      noidung, thoigian, period, userId, giamdocId
    } = this.state;

    if (!noidung) {
      showWarningToast('Vui lòng nhập nội dung nhắc việc', this._toggleSaveState);
    }
    else if (!thoigian) {
      showWarningToast('Vui lòng chọn thời gian', this._toggleSaveState);
    } else {
      this.setState({
        executing: true
      });

      const resultJson = await ReminderApi.saveReminder({
        userId: giamdocId || userId,
        reminderId: 0,
        noidung,
        ngay: thoigian.split(" ")[0],
        gio: thoigian.split(" ")[1].split(":")[0],
        phut: thoigian.split(" ")[1].split(":")[1],
        period: period
      });

      this.setState({
        executing: false
      });

      Toast.show({
        text: resultJson.Status ? "Thêm mới nhắc việc thành công" : "Thêm mới nhắc việc thất bại",
        type: resultJson.Status ? 'success' : 'danger',
        buttonText: "OK",
        buttonStyle: { backgroundColor: Colors.WHITE },
        buttonTextStyle: { color: Colors.LITE_BLUE },
        duration: TOAST_DURATION_TIMEOUT,
        onClose: () => {
          if (resultJson.Status) {
            this.props.updateExtendsNavParams({ check: true });
            this.navigateBack();
            // const screenParam = {
            //   lichhopId: resultJson.Params,
            // };

            // this.props.updateCoreNavParams(screenParam);
            // this.props.navigation.navigate("DetailMeetingDayScreen");
          }
          else {
            this._toggleSaveState();
          }
        }
      });
    }

  }

  onNavigate = (screenName, targetScreenParam) => {
    this.props.updateExtendsNavParams(targetScreenParam);
    this.props.navigation.navigate(screenName);
  }

  onPickGiamdoc = () => {
    const { giamdocId, giamdocName } = this.state;
    this.onNavigate("PickWhoseReminderScreen", {
      giamdocId,
      giamdocName
    });
  }
  clearGiamdoc = () => {
    this.setState({
      giamdocId: 0,
      giamdocName: null
    });
  }

  _toggleSaveState = () => {
    this.setState({
      isSaveBtnPressed: true,
      isSaveIcoPressed: true,
    });
  }

  render() {
    const focusTextboxBorderStyle = { borderColor: Colors.LITE_BLUE, borderBottomWidth: 2 },
      blurTextboxBorderStyle = { borderColor: '#ccc', borderBottomWidth: 2 / 3 },
      {
        noidung, thoigian, period,
        loading, focusId,
        isSaveBtnPressed, isSaveIcoPressed,
        giamdocId, giamdocName, isThuky
      } = this.state,
      nothingChangeStatus = !noidung || !thoigian || !isSaveBtnPressed || !isSaveIcoPressed,
      submitableButtonBackground = !nothingChangeStatus ? { backgroundColor: Colors.LITE_BLUE } : { backgroundColor: Colors.LIGHT_GRAY_PASTEL },
      submitableButtonTextColor = !nothingChangeStatus ? { color: Colors.WHITE } : { color: Colors.DARK_GRAY },
      headerSubmitButtonStyle = !nothingChangeStatus ? { opacity: 1 } : { opacity: 0.6 };


    let bodyContent = null;
    if (loading) {
      bodyContent = dataLoading(true);
    }
    else {
      bodyContent = (
        <KeyboardAwareScrollView contentContainerStyle={{ margin: 5, padding: 5 }}>
          <Form style={{ marginVertical: 10 }}>
            {
              // (this.state.vanbanDenId > 0 || this.state.vanbanDiId > 0) && relateDoc
            }
            <Item stackedLabel style={[{ marginHorizontal: verticalScale(18) }, focusId === "noidung" ? focusTextboxBorderStyle : blurTextboxBorderStyle]}>
              <Label>
                Nội dung <Text style={{ color: '#f00' }}>*</Text>
              </Label>

              <Input
                value={noidung}
                onChangeText={this.handleChange("noidung")}
                onFocus={() => this.setState({ focusId: "noidung" })}
                onBlur={() => this.setState({ focusId: EMPTY_STRING })}
              />
            </Item>

            <CustomPickerButton
              isRender={isThuky}
              labelText='Người được nhắc nhở'
              placeholderText='Chọn người được nhắc nhở'
              valueId={giamdocId}
              valueName={giamdocName}
              pickFunc={() => this.onPickGiamdoc()}
              clearFunc={() => this.clearGiamdoc()}
            />

            <Item stackedLabel style={{ justifyContent: 'center', marginHorizontal: verticalScale(18) }}>
              <Label>Thời điểm nhắc <Text style={{ color: '#f00' }}>*</Text></Label>
              <DatePicker
                locale={"vi"}
                style={DatePickerCustomStyle.containerStyle}
                date={thoigian}
                mode="datetime"
                placeholder='Chọn thời điểm'
                format='DD/MM/YYYY HH:mm'
                // minDate={new Date()}
                confirmBtnText='CHỌN'
                cancelBtnText='BỎ'
                customStyles={CustomStylesDatepicker}
                onDateChange={this.handleChange("thoigian")}
              />
            </Item>

            <Item stackedLabel style={{ marginRight: verticalScale(18) }}>
              <Label>Nhắc việc trước <Text style={{ color: '#f00' }}>*</Text></Label>
              <Picker
                iosHeader='Chọn thời gian nhắc việc trước'
                mode='dropdown'
                iosIcon={<Icon name='ios-arrow-down' type="Ionicons" />}
                style={{ width: pickerFormat(), justifyContent: 'space-around' }}
                selectedValue={period}
                onValueChange={this.handleChange("period")}>
                {
                  this.state.listPeriod.map((item, index) => (
                    <Picker.Item value={item.Value.toString()} label={item.Text.toString()} key={index} />
                  ))
                }
              </Picker>
            </Item>

            <TouchableOpacity
              onPress={() => this.saveReminder()}
              style={[AccountStyle.submitButton, submitableButtonBackground]}
              disabled={nothingChangeStatus}
            >
              <Text style={[AccountStyle.submitButtonText, submitableButtonTextColor]}>LƯU</Text>
            </TouchableOpacity>
          </Form>
        </KeyboardAwareScrollView>
      );
    }

    return (
      <Container>
        <Header style={NativeBaseStyle.container}>
          <Left style={NativeBaseStyle.left}>
            <GoBackButton onPress={() => this.navigateBack()} />
          </Left>

          <Body style={NativeBaseStyle.body}>
            <Title style={NativeBaseStyle.bodyTitle}>
              THÊM MỚI NHẮC VIỆC
						</Title>
          </Body>

          <Right style={NativeBaseStyle.right}>
            <HeaderRightButton
              iconName='save' iconType='material'
              onPress={() => this.saveReminder()}
              btnStyle={headerSubmitButtonStyle} btnDisabled={nothingChangeStatus}
            />
          </Right>
        </Header>
        {bodyContent}
        {
          executeLoading(this.state.executing)
        }
      </Container>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    userInfo: state.userState.userInfo,
    extendsNavParams: state.navState.extendsNavParams
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateExtendsNavParams: (extendsNavParams) => dispatch(navAction.updateExtendsNavParams(extendsNavParams)),
    updateCoreNavParams: (coreNavParams) => dispatch(navAction.updateCoreNavParams(coreNavParams))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateReminder);

