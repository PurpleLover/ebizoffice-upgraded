/*
	@description: danh sách văn bản trình kí đã lọc
	@author: duynn
	@since: 15/05/2018
*/
'use strict'
import React, { Component } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';

//redux
import { connect } from 'react-redux';
import * as vanbandiAction from '../../../redux/modules/VanBanDi/Action';

//lib
import {
  Container, Header, Item, Icon, Input, Body, Text,
  Content, List, ListItem, Right, Button
} from 'native-base'
import renderIf from 'render-if';

//utilities
import { formatLongText } from '../../../common/Utilities';
import {
  HEADER_COLOR, LOADER_COLOR, DOKHAN_CONSTANT,
  VANBAN_CONSTANT, DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE,
  Colors
} from '../../../common/SystemConstant';
import { indicatorResponsive } from '../../../assets/styles/ScaleIndicator';

//style
import { moderateScale } from '../../../assets/styles/ScaleIndicator';
import { MoreButton } from '../../common';
import { vanbandiApi } from '../../../common/Api';

class SearchList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.userInfo.ID,
      filterType: this.props.navigation.state.params.docType,
      filterValue: this.props.filterValue,
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE,
      data: [],
      loadingMoreData: false,
      refreshingData: false,
      loadingData: false
    }
  }

  componentDidMount() {
    this.setState({
      loadingData: true
    }, () => {
      this.fetchData()
    })
  }

  fetchData = async () => {
    const {
      filterType,
      userId, pageSize, pageIndex, filterValue,
    } = this.state;

    const refreshingData = this.state.refreshingData;
    const loadingData = this.state.loadingData;

    let apiUrlParam = 'GetListProcessing';
    if (filterType == VANBAN_CONSTANT.DA_XULY) {
      apiUrlParam = 'GetListProcessed';
    } else if (filterType == VANBAN_CONSTANT.CAN_REVIEW) {
      apiUrlParam = 'GetListReview';
    } else if (filterType == VANBAN_CONSTANT.DA_REVIEW) {
      apiUrlParam = 'GetListReviewed';
    }

    let result = await vanbandiApi().getSearchList([
      apiUrlParam,
      userId,
      pageSize,
      `${pageIndex}?query=${filterValue}`
    ]);

    this.setState({
      refreshingData: false,
      loadingData: false,
      loadingMore: false,
      data: (refreshingData || loadingData) ? result : [...this.state.data, ...result]
    });
  }

  navigateBackToList() {
    let screenName = 'ListIsNotProcessedScreen';

    if (this.state.filterType == VANBAN_CONSTANT.DA_XULY) {
      screenName = 'ListIsProcessedScreen'
    } else if (this.state.filterType == VANBAN_CONSTANT.CAN_REVIEW) {
      screenName = 'ListIsNotReviewedScreen'
    } else if (this.state.fitlerType == VANBAN_CONSTANT.DA_REVIEW) {
      screenName = 'ListIsReviewedScreen'
    }
    this.props.navigation.navigate(screenName);
  }

  renderItem = ({ item }) => {
    return (
      <ListItem button onPress={() => this.navigateToDocDetail(item.ID)} icon>
        <Body>
          <Text>
            {`SỐ HIỆU: ${formatLongText(item.SOHIEU, 15)}`} {item.HAS_FILE ? <Icon name='ios-attach' /> : null}
          </Text>
        </Body>

        <Right>
          <Button style={{
            backgroundColor: (item.DOKHAN_ID == DOKHAN_CONSTANT.THUONG_KHAN) ? '#FF0033' : ((item.DOKHAN_ID == DOKHAN_CONSTANT.KHAN) ? '#FF6600' : '#337321'),
            borderRadius: 3
          }}>
            <Text style={{ fontSize: moderateScale(10, 0.9), fontWeight: 'bold' }}>
              {(item.DOKHAN_ID == DOKHAN_CONSTANT.THUONG_KHAN) ? 'R.Q.TRỌNG' : ((item.DOKHAN_ID == DOKHAN_CONSTANT.KHAN) ? 'Q.TRỌNG' : 'THƯỜNG')}
            </Text>
          </Button>
        </Right>
      </ListItem>
    );
  }

  onFilter = () => {
    this.props.editFilterValue(this.state.filterValue);
    this.setState({
      loadingData: true,
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE
    }, () => {
      this.fetchData()
    })
  }

  handleRefresh = () => {
    this.setState({
      refreshingData: true,
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE
    }, () => {
      this.fetchData()
    })
  }

  loadingMore = () => {
    this.setState({
      loadingMore: true,
      pageIndex: this.state.pageIndex + 1,
    }, () => {
      this.fetchData()
    })
  }

  render() {
    return (
      <Container>
        <Header searchBar rounded style={{ backgroundColor: HEADER_COLOR }}>
          <Item style={{ backgroundColor: Colors.WHITE }}>
            <Icon name='ios-arrow-round-back' onPress={() => this.navigateBackToList()} />
            <Input placeholder='Mã hiệu, trích yếu'
              value={this.state.filterValue}
              onChangeText={(filterValue) => this.setState({ filterValue })}
              onSubmitEditing={() => this.onFilter()} />
            <Icon name='ios-document' />
          </Item>
        </Header>

        <Content contentContainerStyle={{ flex: 1, justifyContent: (this.state.loadingData) ? 'center' : 'flex-start' }}>
          {
            renderIf(!this.state.loadingData)(
              <List>
                <FlatList
                  data={this.state.data}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={this.renderItem}
                  refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshingData}
                      onRefresh={this.handleRefresh}
                      title='Kéo để làm mới'
                      colors={[LOADER_COLOR]}
                      tintColor={[LOADER_COLOR]}
                      titleColor='red'
                    />
                  }
                  ListFooterComponent={() => (<MoreButton
                    isLoading={this.state.loadingMore}
                    isTrigger={this.state.data.length >= DEFAULT_PAGE_SIZE}
                    loadmoreFunc={this.loadingMore}
                  />)}
                />
              </List>
            )
          }

          {
            renderIf(this.state.loadingData)(
              <ActivityIndicator size={indicatorResponsive} animating color={LOADER_COLOR} />
            )
          }
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    userInfo: state.userState.userInfo,
    filterValue: state.signDocState.filterValue
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    editFilterValue: (filterValue) => dispatch(vanbandiAction.editFilterValue(filterValue))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchList);