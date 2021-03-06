import React, { Component } from 'react'
import {
  FlatList, RefreshControl, AsyncStorage, StatusBar
} from 'react-native'

//constant
import {
  DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE, Colors
} from '../../../common/SystemConstant';
import { emptyDataPage, showWarningToast } from '../../../common/Utilities';
import { dataLoading } from '../../../common/Effect';

import {
  Container, Header, Title, Content,
  Left, Body, Right
} from 'native-base';
import renderIf from 'render-if';
import util from 'lodash';

//redux
import { connect } from 'react-redux';
import * as navAction from '../../../redux/modules/Nav/Action';
import { accountApi } from '../../../common/Api';
import { RecentNoti, AuthorizeNoti } from '../../common/DashboardCommon';
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
import { AddButton, MoreButton } from '../../common';

const AccountApi = accountApi();

class ListNotification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: props.userInfo,
      loading: false,
      loadingMore: false,
      refreshing: false,
      data: [],
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE,

      dataUyQuyen: [],
      isRefreshNotiList: false,
      canUyQuyen: false,
    }
  }

  componentDidMount = async () => {
    const userInfo = this.state.userInfo;
    userInfo.numberUnReadMessage = 0;
    await AsyncStorage.removeItem('firebaseNotification');
    await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
    this._navListener = this.props.navigation.addListener('didFocus', () => {
      StatusBar.setBarStyle('light-content');
      if (this.state.isRefreshNotiList) {
        this.setState({
          loading: true,
          isRefreshNotiList: false
        }, () => this.fetchData());
      }
      if (this.props.extendsNavParams.hasOwnProperty("checkRefreshUyQuyenList")) {
        if (this.props.extendsNavParams.checkRefreshUyQuyenList === true) {
          this.setState({
            loading: true
          }, () => this.fetchDataUyQuyen())
        }
        this.props.updateExtendsNavParams({ checkRefreshUyQuyenList: false });
      }
    });
  }

  componentWillMount = () => {
    this.setState({
      loading: true
    }, () => {
      this.fetchData();
      this.fetchDataUyQuyen();
      this.fetchCheckUyQuyen();
    });
  }

  componentWillUnmount = () => {
    this._navListener.remove();
  }

  onLoadingMore = () => {
    this.setState({
      loadingMore: true,
      pageIndex: this.state.pageIndex + 1
    }, () => this.fetchData())
  }

  handleRefresh = () => {
    this.setState({
      refreshing: true,
      pageSize: DEFAULT_PAGE_SIZE,
      pageIndex: DEFAULT_PAGE_INDEX
    }, () => this.fetchData())
  }

  fetchDataUyQuyen = async () => {
    const result = await AccountApi.getListNotiUyquyen();

    this.setState({
      loading: false,
      dataUyQuyen: result
    })
  }

  fetchCheckUyQuyen = async () => {
    const result = await AccountApi.getCheckAuthorization([
      this.state.userInfo.ID,
    ]);
    this.setState({
      canUyQuyen: result.Status,
    });
    if (result.Message) {
      showWarningToast(result.Message);
    }
  }

  fetchData = async () => {
    const {
      userInfo, pageSize, pageIndex
    } = this.state;
    const result = await AccountApi.getRecentNoti([
      userInfo.ID,
      pageSize,
      pageIndex,
      "true?query="
    ]);

    this.setState({
      loading: false,
      loadingMore: false,
      refreshing: false,
      data: this.state.loadingMore ? this.state.data.concat(result) : result
    })
  }
  renderItem = ({ item, index }) => (<RecentNoti
    item={item} index={index} key={index.toString()}
    successFunc={this.onNavigateToScreen}
    readFunc={this.checkRefreshList}
  />)
  onNavigateToScreen = (screenName = '', screenParam = {}) => {
    this.props.updateCoreNavParams(screenParam);
    this.props.navigation.navigate(screenName);
  }
  checkRefreshList = () => {
    this.setState({
      isRefreshNotiList: true,
    });
  }

  createNotiUyQuyen = () => {
    this.props.navigation.navigate("CreateNotiUyQuyenScreen");
  }

  render() {
    const { loading, dataUyQuyen } = this.state;
    let bodyContent = null;
    if (loading) {
      bodyContent = dataLoading(loading);
    } else {
      bodyContent = (
        <Content contentContainerStyle={{ flex: 1 }}>
          {
            (util.isArray(dataUyQuyen) && dataUyQuyen.length > 0) 
              && dataUyQuyen.map((item, index) => (<AuthorizeNoti key={index.toString()} item={item} index={index} />))
          }
          <FlatList
            data={this.state.data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={this.renderItem}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this.handleRefresh}
                colors={[Colors.BLUE_PANTONE_640C]}
                tintColor={[Colors.BLUE_PANTONE_640C]}
                title='Kéo để làm mới'
                titleColor={Colors.RED}
              />
            }
            ListEmptyComponent={() =>
              emptyDataPage()
            }
            ListFooterComponent={() => (<MoreButton
              isLoading={this.state.loadingMore}
              isTrigger={this.state.data.length >= DEFAULT_PAGE_SIZE}
              loadmoreFunc={this.onLoadingMore} />)}
          />
        </Content>
      );
    }

    return (
      <Container>
        <StatusBar barStyle="light-content" />
        <Header style={NativeBaseStyle.container}>
          <Left style={{ flex: 1 }} />
          <Body style={{ alignItems: 'center', flex: 8 }}>
            <Title style={NativeBaseStyle.bodyTitle}>
              THÔNG BÁO
            </Title>
          </Body>
          <Right style={{ flex: 1 }} />
        </Header>

        {bodyContent}
        <AddButton
          hasPermission={this.state.canUyQuyen}
          createFunc={this.createNotiUyQuyen}
        />
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
    updateExtendsNavParams: (coreNavParams) => dispatch(navAction.updateExtendsNavParams(coreNavParams)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ListNotification);