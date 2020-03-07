/*
	@description: tạo công việc con
	@author: duynn
	@since: 19/05/2018
*/
'use strict'
import React, { Component } from 'react';
import {
  TouchableOpacity} from 'react-native';
//lib
import {
  Container, Header, Left, Body, Right, Item, Title, Text, Icon, Input,
  Form, Picker, Toast, Label, Textarea
} from 'native-base'
import { Icon as RneIcon, ListItem } from 'react-native-elements';
import DatePicker from 'react-native-datepicker';
import 'moment/locale/vi';

//utilities
import { EMPTY_STRING, Colors, TOAST_DURATION_TIMEOUT } from '../../../common/SystemConstant';
import { verticalScale } from '../../../assets/styles/ScaleIndicator';
import { executeLoading, dataLoading } from '../../../common/Effect';
import { formatLongText, showWarningToast } from '../../../common/Utilities';
import * as util from 'lodash';

//redux
import { connect } from 'react-redux';
import * as navAction from '../../../redux/modules/Nav/Action';

//style
import { moderateScale } from '../../../assets/styles/ScaleIndicator';
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
import AccountStyle from '../../../assets/styles/AccountStyle';
import { DetailTaskStyle } from '../../../assets/styles/TaskStyle';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { taskApi } from '../../../common/Api';
import { DatePickerCustomStyle, InputCreateStyle, PickerCreateStyle, CustomStylesDatepicker } from '../../../assets/styles/index';
import { CustomPickerButton, GoBackButton } from '../../common';

const TaskApi = taskApi();

class CreateTask extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: props.userInfo.ID,

      // taskId: props.coreNavParams.taskId,
      // taskType: props.coreNavParams.taskType,

      docId: props.extendsNavParams.docId || 0,
      docType: props.extendsNavParams.docType || 0,

      title: EMPTY_STRING,
      deadline: null,
      content: EMPTY_STRING,
      startDate: null,
      purpose: EMPTY_STRING,
      listPriority: [],
      listUrgency: [],
      priorityValue: EMPTY_STRING, //độ ưu tiên
      urgencyValue: EMPTY_STRING, //đô khẩn
      planValue: '0', //lập kế hoạch 
      giaoviecId: 0,
      reminderDays: "1",

      executing: false,
      focusId: EMPTY_STRING,
      fromScreen: props.extendsNavParams.originScreen || EMPTY_STRING,
      loading: false,

      listRole: EMPTY_STRING,
      isGiamdoc: false,
      isThuky: false,
      vanbanDenLienquan: {},
      vanbanDiLienquan: {},
      vanbanDiDokhan: EMPTY_STRING,
      vanbanDenId: 0,
      vanbanDiId: 0,
      giaoviecName: null,

      isSaveBtnPressed: true,
      isSaveIcoPressed: true,
    }
  }

  handleChange = fieldName => fieldValue => this.setState({ [fieldName]: fieldValue })

  componentWillMount() {
    this.fetchData();
  }

  componentDidMount = () => {
    this.willFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.extendsNavParams.hasOwnProperty("giaoviecId")) {
        if (this.props.extendsNavParams.giaoviecId > 0) {
          this.setState({
            giaoviecId: this.props.extendsNavParams.giaoviecId,
            giaoviecName: this.props.extendsNavParams.giaoviecName
          });
        }
      }
    });
  }

  componentWillUnmount = () => {
    this.willFocusListener.remove();
  }

  navigateBack = () => {
    this.props.navigation.goBack();
  }

  onPickTaskAssigner = async () => {
    const targetScreenParam = {
      listRole: this.state.listRole,
      giaoviecId: this.state.giaoviecId,
      giaoviecName: this.state.giaoviecName
    };

    this.onNavigate("PickTaskAssignerScreen", targetScreenParam);
  }

  clearTaskAssigner = () => {
    this.setState({
      giaoviecId: 0,
      giaoviecName: null
    });
  }

  fetchData = async () => {
    this.setState({
      loading: true
    });

    const {
      userId, docId, docType
    } = this.state;

    const resultJson = await TaskApi.getCreateHelper([
      userId,
      docType,
      docId
    ]);

    this.setState({
      loading: false,
      listPriority: resultJson.ListDoUuTien,
      listUrgency: resultJson.ListDoKhan,
      priorityValue: resultJson.ListDoUuTien[0].Value,
      urgencyValue: resultJson.ListDoKhan[0].Value,
      isGiamdoc: resultJson.IsGiamdoc,
      listRole: resultJson.ListRole,
      vanbanDenLienquan: resultJson.VanbanDenLienquan,
      vanbanDiLienquan: resultJson.VanbanDiLienquan,
      vanbanDenId: resultJson.VanbanDenId,
      vanbanDiId: resultJson.VanbanDiId,
      vanbanDiDokhan: resultJson.VanbanDiDokhan,
      isThuky: resultJson.IsThuky
    });
  }

  _toggleSaveState = () => {
    this.setState({
      isSaveBtnPressed: true,
      isSaveIcoPressed: true,
    });
  }
  saveTask = async () => {
    this.setState({
      isSaveBtnPressed: false,
      isSaveIcoPressed: false
    });

    const {
      title, deadline, content,
      purpose, priorityValue, urgencyValue, startDate,
      planValue, docId, docType, giaoviecId, userId, reminderDays,
      isThuky
    } = this.state;

    if (util.isNull(title) || util.isEmpty(title)) {
      showWarningToast('Vui lòng nhập nội dung công việc', this._toggleSaveState);
    } else if (util.isNull(content) || util.isEmpty(content)) {
      showWarningToast('Vui lòng nhập nội dung công việc', this._toggleSaveState);
    } else if (util.isNull(deadline) || util.isEmpty(deadline)) {
      showWarningToast('Vui lòng nhập thời hạn xử lý', this._toggleSaveState);
    } else {
      this.setState({
        executing: true
      });

      const resultJson = await TaskApi.saveTask({
        title,
        purpose,
        content,
        deadline,
        startDate,
        priorityValue,
        urgencyValue,
        planValue: +planValue || 0,
        docId,
        docType,
        giaoviecId,
        userId,
        reminderDays: +reminderDays || 1,
        isThuky,
      });

      this.setState({
        executing: false
      });

      Toast.show({
        text: resultJson.Status ? 'Tạo công việc thành công' : 'Tạo công việc không thành công',
        type: resultJson.Status ? 'success' : 'danger',
        buttonText: "OK",
        buttonStyle: { backgroundColor: Colors.WHITE },
        buttonTextStyle: { color: resultJson.Status ? Colors.GREEN_PANTONE_364C : Colors.LITE_BLUE },
        duration: TOAST_DURATION_TIMEOUT,
        onClose: () => {
          if (resultJson.Status) {
            const screenParam = {
              taskId: resultJson.Params,
              taskType: "1",
              from: "createTask"
            };

            this.props.updateCoreNavParams(screenParam);
            this.props.navigation.navigate("DetailTaskScreen");
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

  render() {
    const focusTextboxBorderStyle = { borderColor: Colors.LITE_BLUE, borderBottomWidth: 2 },
      blurTextboxBorderStyle = { borderColor: '#ccc', borderBottomWidth: 2 / 3 },
      {
        title, content, deadline,
        purpose, priorityValue, urgencyValue, startDate, reminderDays,
        vanbanDenId, vanbanDiId, loading, giaoviecName, giaoviecId,
        focusId, isGiamdoc, isThuky,
        isSaveBtnPressed, isSaveIcoPressed
      } = this.state,
      nothingChangeStatus = !title || !content || !deadline || !isSaveBtnPressed || !isSaveIcoPressed,
      submitableButtonBackground = !nothingChangeStatus ? { backgroundColor: Colors.LITE_BLUE } : { backgroundColor: Colors.LIGHT_GRAY_PASTEL },
      submitableButtonTextColor = !nothingChangeStatus ? { color: Colors.WHITE } : { color: Colors.DARK_GRAY },
      headerSubmitButtonStyle = !nothingChangeStatus ? { opacity: 1 } : { opacity: 0.6 };

    let relateDoc = null;
    if (vanbanDenId > 0) {
      const {
        SOHIEU, TRICHYEU, NGUOIKY
      } = this.state.vanbanDenLienquan;
      relateDoc = (
        <ListItem
          style={DetailTaskStyle.listItemContainer}
          hideChevron={true}
          title={
            <Text style={DetailTaskStyle.listItemTitleContainer}>Văn bản đến liên quan</Text>
          }
          subtitle={
            <Text style={[DetailTaskStyle.listItemSubTitleContainer, { color: '#262626' }]}>
              <Text>{`Số hiệu: ${SOHIEU}` + "\n"}</Text>
              <Text>{`Trích yếu: ${formatLongText(TRICHYEU, 50)}` + "\n"}</Text>
              <Text>{`Người ký: ${NGUOIKY}`}</Text>
            </Text>
          }
          // onPress={() => this.navigateToVanbanLienquan("VanBanDenDetailScreen")}
          containerStyle={{ backgroundColor: 'rgba(189,198,207, 0.6)' }}
        />
      );
    }
    else if (vanbanDiId > 0) {
      const {
        TRICHYEU, TEN_NGUOIKY
      } = this.state.vanbanDiLienquan;
      relateDoc = (
        <ListItem
          style={DetailTaskStyle.listItemContainer}
          hideChevron={true}
          title={
            <Text style={DetailTaskStyle.listItemTitleContainer}>Văn bản đi liên quan</Text>
          }
          subtitle={
            <Text style={[DetailTaskStyle.listItemSubTitleContainer, { color: '#262626' }]}>
              <Text>{`Trích yếu: ${formatLongText(TRICHYEU, 50)}` + "\n"}</Text>
              <Text>{`Người ký: ${TEN_NGUOIKY}` + "\n"}</Text>
              <Text>{`Độ khẩn: ${this.state.vanbanDiDokhan}`}</Text>
            </Text>
          }
          // onPress={
          //   () => this.navigateToVanbanLienquan("VanBanDiDetailScreen")
          // }
          containerStyle={{ backgroundColor: 'rgba(189,198,207, 0.6)' }}
        />
      );
    }

    let bodyContent = null;
    if (loading) {
      bodyContent = dataLoading(true);
    }
    else {
      bodyContent = (
        <KeyboardAwareScrollView contentContainerStyle={{ margin: 5, padding: 5 }}>
          <Form style={{ marginVertical: verticalScale(10) }}>
            {
              (this.state.vanbanDenId > 0 || this.state.vanbanDiId > 0) && relateDoc
            }
            <Item stackedLabel style={[InputCreateStyle.container, focusId === "title" ? focusTextboxBorderStyle : blurTextboxBorderStyle]}>
              <Label style={InputCreateStyle.label}>
                Tên công việc <Text style={InputCreateStyle.label, [{ color: '#f00' }]}>*</Text>
              </Label>

              <Input
                value={title}
                onChangeText={this.handleChange("title")}
                onFocus={() => this.setState({ focusId: "title" })}
                onBlur={() => this.setState({ focusId: EMPTY_STRING })}
                style={InputCreateStyle.input}
              />
            </Item>

            <CustomPickerButton
              isRender={isGiamdoc === false && isThuky === false}
              labelText='Người giao việc'
              placeholderText='Chọn người giao việc'
              valueId={giaoviecId}
              valueName={giaoviecName}
              pickFunc={() => this.onPickTaskAssigner()}
              clearFunc={() => this.clearTaskAssigner()}
            />

            <CustomPickerButton
              isRender={isThuky === true}
              labelText='Giao việc thay cho'
              placeholderText='Chọn người giao việc thay'
              valueId={giaoviecId}
              valueName={giaoviecName}
              pickFunc={() => this.onPickTaskAssigner()}
              clearFunc={() => this.clearTaskAssigner()}
            />

            <Item stackedLabel style={PickerCreateStyle.container}>
              <Label style={InputCreateStyle.label}>Độ ưu tiên</Label>
              <Picker
                iosHeader='Chọn độ ưu tiên'
                headerBackButtonText='Quay lại'
                mode='dropdown'
                iosIcon={<Icon name='ios-arrow-down' type="Ionicons" style={{ fontSize: moderateScale(15.15, 0.85) }} />}
                style={PickerCreateStyle.picker}
                selectedValue={priorityValue}
                onValueChange={this.handleChange("priorityValue")}>
                {
                  this.state.listPriority.map((item, index) => (
                    <Picker.Item value={item.Value.toString()} label={item.Text.toString()} key={index} />
                  ))
                }
              </Picker>
            </Item>

            <Item stackedLabel style={PickerCreateStyle.container}>
              <Label style={InputCreateStyle.label}>Mức độ quan trọng</Label>
              <Picker
                iosHeader='Chọn mức quan trọng'
                headerBackButtonText='Quay lại'
                mode='dropdown'
                iosIcon={<Icon name='ios-arrow-down' type="Ionicons" style={{ fontSize: moderateScale(15.15, 0.85) }} />}
                style={PickerCreateStyle.picker}
                selectedValue={urgencyValue}
                onValueChange={this.handleChange("urgencyValue")}>
                {
                  this.state.listUrgency.map((item, index) => (
                    <Picker.Item value={item.Value.toString()} label={item.Text.toString()} key={index} />
                  ))
                }
              </Picker>
            </Item>

            {
              //   <Item stackedLabel>
              //   <Label>Lập kế hoạch</Label>
              //   <Picker
              //     iosHeader='Chọn mức quan trọng'
              //     mode='dropdown'
              //     iosIcon={<Icon name='ios-arrow-down' type="Ionicons" />}
              //     style={{ width: pickerFormat() }}
              //     // itemTextStyle={{marginHorizontal:20}}
              //     // itemStyle={{marginHorizontal:40}}
              //     selectedValue={this.state.planValue}
              //     onValueChange={this.handleChange("planValue")}>
              //     <Picker.Item value="1" label="Có" />
              //     <Picker.Item value="0" label="Không" />
              //   </Picker>
              // </Item>
            }

            <Item stackedLabel style={InputCreateStyle.container}>
              <Label style={InputCreateStyle.label}>Ngày nhận việc</Label>
              <DatePicker
                style={DatePickerCustomStyle.containerStyle}
                date={startDate}
                mode="date"
                placeholder='Chọn ngày nhận việc'
                format='DD/MM/YYYY'
                minDate={new Date()}
                confirmBtnText='CHỌN'
                cancelBtnText='BỎ'
                customStyles={CustomStylesDatepicker}
                onDateChange={this.handleChange("startDate")}
              />
            </Item>

            <Item stackedLabel style={InputCreateStyle.container}>
              <Label style={InputCreateStyle.label}>Hạn hoàn thành <Text style={[InputCreateStyle.label, { color: '#f00' }]}>*</Text></Label>
              <DatePicker
                style={DatePickerCustomStyle.containerStyle}
                date={deadline}
                mode="date"
                placeholder='Chọn hạn hoàn thành'
                format='DD/MM/YYYY'
                minDate={new Date()}
                confirmBtnText='CHỌN'
                cancelBtnText='BỎ'
                customStyles={CustomStylesDatepicker}
                onDateChange={this.handleChange("deadline")}
              />
            </Item>

            <Item stackedLabel style={[InputCreateStyle.container, focusId === "reminderDays" ? focusTextboxBorderStyle : blurTextboxBorderStyle]}>
              <Label style={InputCreateStyle.label}>
                Nhắc việc trước (ngày)
              </Label>

              <Input
                style={[InputCreateStyle.input, { textAlign: 'center' }]}
                value={reminderDays}
                onChangeText={this.handleChange("reminderDays")}
                onFocus={() => this.setState({ focusId: "reminderDays" })}
                onBlur={() => this.setState({ focusId: EMPTY_STRING })}
                keyboardType="number-pad"
              />
            </Item>

            <Item stackedLabel style={InputCreateStyle.container}>
              <Label style={InputCreateStyle.label}>
                Nội dung <Text style={[InputCreateStyle.label, InputCreateStyle.labelMust]}>*</Text>
              </Label>

              <Textarea
                rowSpan={3}
                bordered
                value={this.state.content}
                onChangeText={this.handleChange("content")}
                style={[InputCreateStyle.input, InputCreateStyle.textarea, focusId === "content" ? focusTextboxBorderStyle : blurTextboxBorderStyle]}
                onFocus={() => this.setState({ focusId: "content" })}
                onBlur={() => this.setState({ focusId: EMPTY_STRING })}
              />

            </Item>

            <Item stackedLabel style={InputCreateStyle.container}>
              <Label style={InputCreateStyle.label}>
                Mục tiêu
              </Label>

              <Textarea
                rowSpan={3}
                bordered
                value={purpose}
                onChangeText={this.handleChange("purpose")}
                style={[InputCreateStyle.input, InputCreateStyle.textarea, focusId === "purpose" ? focusTextboxBorderStyle : blurTextboxBorderStyle]}
                onFocus={() => this.setState({ focusId: "purpose" })}
                onBlur={() => this.setState({ focusId: EMPTY_STRING })}
              />
            </Item>

            <TouchableOpacity
              onPress={() => this.saveTask()}
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
              THÊM MỚI CÔNG VIỆC
						</Title>
          </Body>

          <Right style={NativeBaseStyle.right}>
            <TouchableOpacity onPress={() => this.saveTask()} style={headerSubmitButtonStyle} disabled={nothingChangeStatus}>
              <RneIcon name='save' size={moderateScale(28, 1.03)} color={Colors.WHITE} />
            </TouchableOpacity>
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
    // coreNavParams: state.navState.coreNavParams,
    extendsNavParams: state.navState.extendsNavParams
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateExtendsNavParams: (extendsNavParams) => dispatch(navAction.updateExtendsNavParams(extendsNavParams)),
    updateCoreNavParams: (coreNavParams) => dispatch(navAction.updateCoreNavParams(coreNavParams))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateTask);
