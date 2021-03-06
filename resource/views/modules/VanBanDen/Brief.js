'use strict'
import React, { Component } from 'react';
import { View, Text as RnText, FlatList } from 'react-native';
//redux
import { connect } from 'react-redux';

//utilities
import { Colors, DOKHAN_CONSTANT } from '../../../common/SystemConstant';
import { unAuthorizePage, emptyDataPage, getColorCodeByProgressValue, convertDateToString, formatLongText } from '../../../common/Utilities';
import { dataLoading, executeLoading } from '../../../common/Effect';
import * as util from 'lodash';
import { moderateScale } from '../../../assets/styles/ScaleIndicator';

//styles
import { TabStyle } from '../../../assets/styles/TabStyle';
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
//lib
import {
  Container, Header, Left, Body, Icon, Title, Tabs, Tab, TabHeading, Text, Right
} from 'native-base';
import {
  Icon as RneIcon, ListItem
} from 'react-native-elements';

import renderIf from 'render-if';

import { ListSignDocStyle } from '../../../assets/styles/SignDocStyle';
import { ListTaskStyle } from '../../../assets/styles/TaskStyle';

//redux
import * as navAction from '../../../redux/modules/Nav/Action';
import { GoBackButton } from '../../common';
import { vanbandenApi } from '../../../common/Api';

class Brief extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.userInfo.ID,
      isUnAuthorize: false,

      docId: this.props.coreNavParams.docId,
      docType: this.props.coreNavParams.docType,
      docInfo: {},

      loading: false,
      executing: false
    }
  }

  componentWillMount() {
    this.fetchData()
  }

  componentDidMount = () => {
    // backHandlerConfig(true, this.navigateBackToList);
    this.willFocusListener = this.props.navigation.addListener('willFocus', () => {
      if (this.props.extendsNavParams.hasOwnProperty("check")) {
        if (this.props.extendsNavParams.check === true) {
          this.setState({
            loading: true
          }, () => {
            this.fetchData();
          });
          this.props.updateExtendsNavParams({ check: false });
        }
      }
    })
  }

  componentWillUnmount = () => {
    // backHandlerConfig(false, this.navigateBackToList);
    this.willFocusListener.remove();
  }

  navigateBackToDetailVanbanDen = () => {
    const pastNavParams = {
      docId: this.state.docId,
      docType: this.state.docType
    }
    this.props.updateCoreNavParams(pastNavParams);
    this.props.updateExtendsNavParams({});
    this.props.navigation.goBack();
  }
  /**
   * Hàm điều hướng vào chi tiết văn bản đi hoặc công việc liên quan
   */
  navigateToDetail = (itemId, isDoc = false) => {
    let targetScreenParam = {
      taskId: itemId,
      taskType: 0,
      fromBrief: true
    }
    if (isDoc) {
      targetScreenParam = {
        docId: itemId,
        docType: 0,
        fromBrief: true
      }
      this.props.updateCoreNavParams(targetScreenParam);
      this.props.navigation.navigate("VanBanDiDetailScreen");
    }
    else {
      this.props.updateCoreNavParams(targetScreenParam);
      this.props.navigation.navigate("DetailTaskScreen");
    }
  }

  async fetchData() {
    this.setState({
      loading: true
    });

    const resultJson = await vanbandenApi().getBrief([
      this.state.docId
    ]);

    this.setState({
      loading: false,
      isUnAuthorize: util.isNull(resultJson),
      docInfo: resultJson
    });
  }

  render() {
    let bodyContent = null;
    if (this.state.loading) {
      bodyContent = dataLoading(true);
    }
    else if (this.state.isUnAuthorize) {
      bodyContent = unAuthorizePage(this.props.navigation);
    } else {
      bodyContent = <DetailContent docInfo={this.state.docInfo} navigateToDetail={this.navigateToDetail} />
    }

    return (
      <Container>
        <Header hasTabs style={NativeBaseStyle.container}>
          <Left style={NativeBaseStyle.left}>
            <GoBackButton onPress={() => this.navigateBackToDetailVanbanDen()} />
          </Left>

          <Body style={NativeBaseStyle.body}>
            <Title style={NativeBaseStyle.bodyTitle} >
              HỒ SƠ VĂN BẢN
            </Title>
          </Body>

          <Right style={NativeBaseStyle.right}>
          </Right>
        </Header>
        {
          bodyContent
        }
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
    coreNavParams: state.navState.coreNavParams,
    extendsNavParams: state.navState.extendsNavParams
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateCoreNavParams: (coreNavParams) => dispatch(navAction.updateCoreNavParams(coreNavParams)),
    updateExtendsNavParams: (extendsNavParams) => dispatch(navAction.updateExtendsNavParams(extendsNavParams))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Brief);

//THÔNG TIN VĂN BẢN
class DetailContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTabIndex: 0,
      docInfo: props.docInfo
    }
  }

  render() {
    const { groupOfCongViecs, groupOfVanBanDis } = this.state.docInfo;

    return (
      <View style={{ flex: 1 }}>
        <Tabs
          // renderTabBar={() => <ScrollableTab />}
          tabContainerStyle={{ height: moderateScale(47, 0.97) }}
          initialPage={this.state.currentTabIndex}
          tabBarUnderlineStyle={TabStyle.underLineStyle}
          onChangeTab={({ index }) => this.setState({ currentTabIndex: index })}>
          <Tab heading={
            <TabHeading style={(this.state.currentTabIndex == 0 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
              <RneIcon name='file-account' iconStyle={TabStyle.activeText} type='material-community' />
              <Text style={(this.state.currentTabIndex == 0 ? TabStyle.activeText : TabStyle.inActiveText)}>
                DANH SÁCH CÔNG VIỆC
              </Text>
            </TabHeading>
          }>
            <BriefTaskList info={groupOfCongViecs} navigateToDetail={this.props.navigateToDetail} />
          </Tab>

          <Tab heading={
            <TabHeading style={(this.state.currentTabIndex == 1 ? TabStyle.activeTab : TabStyle.inActiveTab)}>
              <RneIcon name='file-restore' iconStyle={TabStyle.activeText} type='material-community' />
              <Text style={(this.state.currentTabIndex == 1 ? TabStyle.activeText : TabStyle.inActiveText)}>
                VĂN BẢN PHẢN HỒI
              </Text>
            </TabHeading>
          }>
            <BriefResponseList info={groupOfVanBanDis} navigateToDetail={this.props.navigateToDetail} />
          </Tab>
        </Tabs>
      </View>
    );
  }
}

class BriefTaskList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.info || []
    }
  }

  renderItem = ({ item }) => {
    return (
      <View>
        <ListItem
          hideChevron={true}
          badge={{
            value: (item.PHANTRAMHOANTHANH || 0) + '%',
            textStyle: {
              color: Colors.WHITE,
              fontWeight: 'bold'
            },
            containerStyle: {
              backgroundColor: getColorCodeByProgressValue(item.PHANTRAMHOANTHANH),
              borderRadius: 3
            }
          }}

          leftIcon={
            <View style={ListTaskStyle.leftSide}>
              {
                renderIf(item.HAS_FILE)(
                  <Icon name='ios-attach' />
                )
              }
            </View>
          }

          title={
            <RnText style={item.IS_READ === true ? ListTaskStyle.textRead : ListTaskStyle.textNormal}>
              <RnText style={{ fontWeight: 'bold' }}>
                Tên công việc:
                </RnText>
              <RnText>
                {' ' + item.TENCONGVIEC}
              </RnText>
            </RnText>
          }

          subtitle={
            <RnText style={[item.IS_READ === true ? ListTaskStyle.textRead : ListTaskStyle.textNormal, ListTaskStyle.abridgment]}>
              <RnText style={{ fontWeight: 'bold' }}>
                Hạn xử lý:
                            </RnText>
              <RnText>
                {' ' + convertDateToString(item.NGAYHOANTHANH_THEOMONGMUON)}
              </RnText>
            </RnText>
          }
          onPress={() => this.props.navigateToDetail(item.ID, false)}
        />

      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={this.state.data}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={this.renderItem}
          ListEmptyComponent={() => emptyDataPage()}
        />
      </View>
    );
  }
}

class BriefResponseList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.info || []
    }
  }

  renderItem = ({ item }) => {
    let mahieu = (
      <RnText>
        {' ' + item.SOHIEU}
      </RnText>
    )
    if (item.SOHIEU === null || item.SOHIEU === "") {
      mahieu = (
        <RnText style={{ color: Colors.RED_PANTONE_186C }}> Không rõ</RnText>
      );
    }

    return (
      <View>
        <ListItem
          hideChevron={true}
          badge={{
            value: (item.DOKHAN_ID == DOKHAN_CONSTANT.THUONG_KHAN) ? 'R.Q.TRỌNG' : ((item.DOKHAN_ID == DOKHAN_CONSTANT.KHAN) ? 'Q.TRỌNG' : 'THƯỜNG'),
            textStyle: {
              color: Colors.WHITE,
              fontWeight: 'bold'
            },
            containerStyle: {
              backgroundColor: (item.DOKHAN_ID == DOKHAN_CONSTANT.THUONG_KHAN) ? Colors.RED_PANTONE_186C : ((item.DOKHAN_ID == DOKHAN_CONSTANT.KHAN) ? Colors.RED_PANTONE_021C : Colors.GREEN_PANTONE_364C),
              borderRadius: 3
            }
          }}
          leftIcon={
            <View style={ListSignDocStyle.leftSide}>
              {
                renderIf(item.HAS_FILE)(
                  <Icon name='ios-attach' />
                )
              }
            </View>
          }

          title={
            <RnText style={item.IS_READ === true ? ListSignDocStyle.textRead : ListSignDocStyle.textNormal}>
              <RnText style={{ fontWeight: 'bold' }}>
                Mã hiệu:
                </RnText>

              {mahieu}
            </RnText>
          }

          subtitle={
            <RnText style={[item.IS_READ === true ? ListSignDocStyle.textRead : ListSignDocStyle.textNormal, ListSignDocStyle.abridgment]}>
              <RnText style={{ fontWeight: 'bold' }}>
                Trích yếu:
                </RnText>
              <RnText>
                {' ' + formatLongText(item.TRICHYEU, 50)}
              </RnText>
            </RnText>
          }
          onPress={() => this.props.navigateToDetail(item.ID, true)}
        />
      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={this.state.data}
          keyExtractor={(item) => item.ID.toString()}
          renderItem={this.renderItem}

          ListEmptyComponent={() => emptyDataPage()}
        />
      </View>
    );
  }
}