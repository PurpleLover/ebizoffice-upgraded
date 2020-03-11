/**
 * @description: danh sách văn bản trình ký chưa xử lý
 * @author: duynn
 * @since: 02/05/2018
 */
'use strict'
import React, { Component } from 'react';
import {
  ActivityIndicator, View,
  FlatList, RefreshControl, TouchableOpacity,
  Text as RnText
} from 'react-native';

//redux
import { connect } from 'react-redux';
//lib
import {
  Container, Header, Item, Icon, Input, Body, Text,
  Content, Left, Button, SwipeRow,
  Toast
} from 'native-base'
import renderIf from 'render-if';
import { Icon as RneIcon } from 'react-native-elements';

//utilities
import { emptyDataPage, appStoreDataAndNavigate, convertDateToString, asyncDelay } from '../../../common/Utilities';
import {
  API_URL, DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE,
  Colors,
  TOAST_DURATION_TIMEOUT,
} from '../../../common/SystemConstant';
import { indicatorResponsive, moderateScale } from '../../../assets/styles/ScaleIndicator';
import { executeLoading } from '../../../common/Effect';

import { NativeBaseStyle, AlertMessageStyle } from '../../../assets/styles';
import { MoreButton, GoBackButton, AlertMessage, AlertMessageButton } from '../../common';

class ListUyQuyen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterValue: '',
      userId: this.props.userInfo.ID,
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE,
      loadingData: false,
      loadingMoreData: false,
      refreshingData: false,
      executing: false,
      data: [],

      tmpItemId: '',
    }
  }

  componentWillMount() {
    this.setState({
      loadingData: true
    }, () => {
      this.fetchData();
    })
  }

  async fetchData() {
    const url = `${API_URL}/api/QuanLyUyQuyen/DanhSachUyQuyen/${this.state.userId}/${this.state.pageSize}/${this.state.pageIndex}?query=${this.state.filterValue}`;
    const result = await fetch(url);

    const resultJson = await result.json();

    this.setState({
      data: this.state.loadingMoreData ? [...this.state.data, ...resultJson.ListItem] : resultJson.ListItem,
      loadingData: false,
      loadingMoreData: false,
      refreshingData: false,
      executing: false,
    });
  }

  navigateToDetail = (authorizedId = 0) => {
    let currentScreenName = "ListUyQuyenScreen";
    let targetScreenParam = {
      authorizedId,
    }
    appStoreDataAndNavigate(this.props.navigation, currentScreenName, new Object(), "EditUyQuyenScreen", targetScreenParam);
  }

  onFilter = () => {
    this.setState({
      loadingData: true,
      pageIndex: DEFAULT_PAGE_INDEX
    }, () => {
      this.fetchData()
    })
  }

  loadingMore = () => {
    this.setState({
      loadingMoreData: true,
      pageIndex: this.state.pageIndex + 1,
    }, () => {
      this.fetchData()
    })
  }

  handleRefresh = () => {
    this.setState({
      refreshingData: true,
      pageIndex: DEFAULT_PAGE_INDEX,
    }, () => {
      this.fetchData()
    })
  }

  onConfirmDelete = (itemId) => {
    this.setState({
      tmpItemId: itemId
    }, () => {
      this.refs.confirm.showModal();
    })

    // Alert.alert(
    //     'XÓA ỦY QUYỀN',
    //     'Bạn có chắc chắn xóa bản ghi này',
    //     [
    //         {
    //             text: 'CÓ',
    //             onPress: () => this.onDelete(itemId)
    //         },
    //         {
    //             text: 'KHÔNG',
    //             onPress: () => { }
    //         }
    //     ]
    // )
  }

  onDelete = async (itemId) => {
    this.refs.confirm.closeModal();
    this.setState({
      executing: true
    })
    const url = `${API_URL}/api/QuanLyUyQuyen/${itemId}`
    const result = await fetch(url, {
      method: 'delete',
    }).then(response => response.json());

    await asyncDelay();

    this.setState({
      executing: false
    })
    Toast.show({
      text: result.Status ? 'Xóa ủy quyền thành công' : 'Xóa ủy quyền thất bại',
      type: result.Status ? 'success' : 'danger',
      buttonText: "OK",
      buttonStyle: { backgroundColor: Colors.WHITE },
      buttonTextStyle: { color: result.Status ? Colors.GREEN_PANTONE_364C : Colors.LITE_BLUE },
      duration: TOAST_DURATION_TIMEOUT,
      onClose: () => {
        if (result.Status) {
          this.fetchData();
        }
      }
    });
  }

  renderItem = ({ item }) => {
    return (
      <SwipeRow
        leftOpenValue={75}
        rightOpenValue={-75}
        left={
          <Button style={{ backgroundColor: Colors.LITE_BLUE }} onPress={() => this.navigateToDetail(item.ID)}>
            <RneIcon name='pencil' type='material-community' size={moderateScale(27, 0.79)} color={Colors.WHITE} />
          </Button>
        }
        body={
          <View>
            <Body>
              <Text>{item.TenNguoiDuocUyQuyen}</Text>
              <Text note>
                {convertDateToString(item.NGAY_BATDAU) + " - " + convertDateToString(item.NGAY_KETTHUC)}
              </Text>
            </Body>
          </View>
        }

        right={
          <Button style={{ backgroundColor: Colors.RED }} onPress={() => this.onConfirmDelete(item.ID)}>
            <RneIcon name='trash-can' type='material-community' size={moderateScale(27, 0.79)} color={'#fff'} />
          </Button>
        }
      />
    );
  }

  render() {
    return (
      <Container>
        <Header searchBar rounded style={NativeBaseStyle.container}>
          <Left style={{ flex: 1 }}>
            <GoBackButton onPress={() => this.props.navigation.goBack()} buttonStyle='100%' />
          </Left>
          <Item style={{ backgroundColor: Colors.WHITE, flex: 10 }}>
            <Icon name='ios-search' />
            <Input placeholder='Tên người được ủy quyền'
              value={this.state.filterValue}
              onChangeText={(filterValue) => this.setState({ filterValue })}
              onSubmitEditing={() => this.onFilter()} />
            <Icon name='ios-document' />
          </Item>
        </Header>

        <Content contentContainerStyle={{ flex: 1 }}>
          {
            renderIf(this.state.loadingData)(
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size={indicatorResponsive} animating color={Colors.BLUE_PANTONE_640C} />
              </View>
            )
          }

          {
            renderIf(!this.state.loadingData)(
              <View style={{ flex: 1 }}>
                <FlatList
                  data={this.state.data}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={this.renderItem}
                  refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshingData}
                      onRefresh={this.handleRefresh}
                      colors={[Colors.BLUE_PANTONE_640C]}
                      tintColor={[Colors.BLUE_PANTONE_640C]}
                      title='Kéo để làm mới'
                      titleColor={Colors.RED}
                    />
                  }
                  ListEmptyComponent={() =>
                    this.state.loadingData ? null : emptyDataPage()
                  }
                  ListFooterComponent={() => (<MoreButton
                    isLoading={this.state.loadingMoreData}
                    isTrigger={this.state.data && this.state.data.length >= DEFAULT_PAGE_SIZE}
                    loadmoreFunc={this.loadingMore}
                  />)}
                />

                <AddButton
                  createFunc={this.navigateToDetail}
                />
              </View>
            )
          }

          {
            executeLoading(this.state.executing)
          }
        </Content>

        <AlertMessage
          ref="confirm"
          title="XÓA ỦY QUYỀN"
          bodyText="Bạn có chắc chắn xóa bản ghi này"
          exitText="KHÔNG"
        >
          <AlertMessageButton btnText='CÓ' onPress={() => this.onDelete(this.state.tmpItemId)} />
        </AlertMessage>
      </Container>
    );
  }
}

const mapStatetoProps = (state) => {
  return {
    userInfo: state.userState.userInfo,
  }
}

export default connect(mapStatetoProps)(ListUyQuyen);