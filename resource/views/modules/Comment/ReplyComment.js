/**
 * @description: danh sách trả lời comment
 * @author: annv
 * @since: 07/06/2018
 */
'use strict'
import React, { Component } from 'react';

//redux
import { connect } from 'react-redux';

//utilities
import {
  API_URL, WEB_URL, Colors, DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE, EMPTY_STRING, APPLICATION_SHORT_NAME
} from '../../../common/SystemConstant';
import {
  emptyDataPage, convertDateTimeToString,
  asyncDelay, formatLongText, isImage, formatMessage, showWarningToast
} from '../../../common/Utilities';

//lib
import {
  Alert, View, Text, FlatList, Platform,
  TouchableOpacity, ScrollView, Keyboard
} from 'react-native';
import {
  Container, Header, Left, Right, Body, Title, Input,
  Button, Content, Icon, Footer, Text as NbText, Toast
} from 'native-base';
import renderIf from 'render-if';
import { Icon as RneIcon, ListItem } from 'react-native-elements';
import * as util from 'lodash';
import RNFetchBlob from 'rn-fetch-blob';

import Images from '../../../common/Images';

//styles
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
import {
  ListCommentStyle, ReplyCommentStyle,
  AttachCommentStyle, FooterCommentStyle
} from '../../../assets/styles/CommentStyle';

import { scale, verticalScale, moderateScale, indicatorResponsive } from '../../../assets/styles/ScaleIndicator';
import { dataLoading, executeLoading } from '../../../common/Effect';

//firebase
import { pushFirebaseNotify } from '../../../firebase/FireBaseClient';
import GoBackButton from '../../common/GoBackButton';
import { MoreButton } from '../../common';

const android = RNFetchBlob.android;

class ReplyComment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: props.userInfo.ID,

      comment: props.extendsNavParams.comment,
      isTaskComment: props.extendsNavParams.isTaskComment,

      taskId: props.coreNavParams.taskId,
      taskType: props.coreNavParams.taskType,

      docId: props.coreNavParams.docId,
      docType: props.coreNavParams.docType,

      footerFlex: 0,
      commentContent: EMPTY_STRING,
      data: [],
      executing: false,
      loading: false,
      refreshing: false,
      loadingMore: false,
      pageIndex: DEFAULT_PAGE_INDEX,
      pageSize: DEFAULT_PAGE_SIZE,
    }
  }

  componentWillMount = () => {
    this.setState({
      loading: true
    }, () => this.fetchData());
    this.keyboardWillShowSub = Keyboard.addListener('keyboardWillShow', this.keyboardWillShow);
    this.keyboardWillHideSub = Keyboard.addListener('keyboardWillHide', this.keyboardWillHide);
  }

  componentWillUnmount = () => {
    this.keyboardWillShowSub.remove();
    this.keyboardWillHideSub.remove();
  }

  keyboardWillShow = (event) => {
    this.setState({
      footerFlex: 1
    })
  };

  keyboardWillHide = (event) => {
    this.setState({
      footerFlex: 0
    })
  };

  loadingMore = () => {
    this.setState({
      loadingMore: false,
      pageIndex: this.state.pageIndex + 1
    }, () => this.fetchData())
  }

  handleRefresh = () => {
    this.setState({
      pageIndex: DEFAULT_PAGE_SIZE
    }, () => this.fetchData())
  }

  fetchData = async () => {
    let url = `${API_URL}/api/VanBanDi/GetRepliesOfComment/${this.state.comment.ID}/${this.state.pageIndex}/${this.state.pageSize}`;
    const { isTaskComment } = this.state;

    if (isTaskComment) {
      url = `${API_URL}/api/HscvCongViec/GetRepliesOfComment/${this.state.comment.ID}/${this.state.pageIndex}/${this.state.pageSize}`;
    }
    let result = await fetch(url).then((response) => response.json());
    // if (isTaskComment) {
    //   result = resultJson.LstRootComment;
    // }

    this.setState({
      loading: false,
      loadingMore: false,
      refreshing: false,
      data: this.state.loadingMore ? [...this.state.data, ...result] : result
    })
  }

  navigateToListComment = () => {
    this.props.navigation.goBack();
  }

  sendComment = async () => {
    if (util.isEmpty(this.state.commentContent) || util.isNull(this.state.commentContent)) {
      showWarningToast('Vui lòng nhập nội dung phản hồi');
    } else {
      this.setState({
        executing: true
      });

      let url = `${API_URL}/api/VanBanDi/SaveComment`;
      let headers = new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=utf-8'
      });

      let body = JSON.stringify({
        ID: 0,
        VANBANDI_ID: this.state.docId,
        PARENT_ID: this.state.comment.ID,
        NGUOITAO: this.state.userId,
        NOIDUNGTRAODOI: this.state.commentContent
      });

      if (this.state.isTaskComment) {
        url = `${API_URL}/api/HscvCongViec/SaveComment`;
        headers = new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json;charset=utf-8'
        });

        body = JSON.stringify({
          ID: 0,
          CONGVIEC_ID: this.state.taskId,
          REPLY_ID: this.state.comment.ID,
          USER_ID: this.state.userId,
          NOIDUNG: this.state.commentContent,
          CREATED_BY: this.state.userId
        });
      }

      await asyncDelay(1000);

      const result = await fetch(url, {
        method: 'post',
        headers,
        body
      });

      const resultJson = await result.json();
      this.setState({
        executing: false,
        commentContent: EMPTY_STRING
      }, () => this.fetchData());
    }
  }

  async onDownloadFile(fileName, fileLink, fileExtension) {
    //config save path
    fileLink = fileLink.replace(/\\/, '');
    fileLink = fileLink.replace(/\\/g, '/');
    let date = new Date();
    let url = `${WEB_URL}/Uploads/${fileLink}`;
    // url = url.replace('\\', '/');
    // url = url.replace(/\\/g, '/');
    url = url.replace(/ /g, "%20");
    let regExtension = this.extention(url);
    let extension = "." + regExtension[0];
    const { config, fs } = RNFetchBlob;
    let { PictureDir, DocumentDir } = fs.dirs;

    let savePath = (Platform.OS === 'android' ? PictureDir : DocumentDir) + "/vnio_" + Math.floor(date.getTime() + date.getSeconds() / 2) + extension;

    let options = {};
    let isAllowDownload = true;
    if (Platform.OS == 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'CẤP QUYỀN TRUY CẬP CHO ỨNG DỤNG',
          message: `${APPLICATION_SHORT_NAME} muốn truy cập vào tài liệu của bạn`,
          buttonNeutral: 'Để sau',
          buttonNegative: 'Thoát',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        options = {
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: savePath,
            description: 'VNIO FILE'
          }
        }
      } else {
        isAllowDownload = false;
      }
    } else {
      options = {
        fileCache: true,
        path: savePath
      }
    }

    if (isAllowDownload) {
      config(options).fetch('GET', url).then((res) => {
        if (res.respInfo.status === 404) {
          Alert.alert(
            'THÔNG BÁO',
            'KHÔNG TÌM THẤY TÀI LIỆU',
            [
              {
                text: "ĐÓNG",
                onPress: () => { }
              }
            ]
          );
        } else {
          Alert.alert(
            'THÔNG BÁO',
            `DOWN LOAD THÀNH CÔNG`,
            [
              {
                text: 'MỞ FILE',
                onPress: () => {
                  let openDocConfig = {};

                  if (Platform.OS == 'android') {
                    openDocConfig = {
                      url: `file://${res.path()}`,
                      fileName: fileName,
                      cache: false,
                      fileType: regExtension[0]
                    }
                  } else {
                    openDocConfig = {
                      url: savePath,
                      fileNameOptional: fileName
                    }
                  }

                  OpenFile.openDoc([openDocConfig], (error, url) => {
                    if (error) {
                      Alert.alert(
                        'THÔNG BÁO',
                        error.toString(),
                        [
                          {
                            text: 'OK',
                            onPress: () => { }
                          }
                        ]
                      )
                    } else {
                      console.log(url)
                    }
                  })
                }
              },
              {
                text: 'ĐÓNG',
                onPress: () => { }
              }
            ]
          );
        }
      }).catch((err) => {
        Alert.alert(
          'THÔNG BÁO',
          'DOWNLOAD THẤT BẠI',
          [
            {
              text: err.toString(),
              onPress: () => { }
            }
          ]
        )
      })
    }
  }

  renderItem = ({ item }) => {
    return (
      <ListItem
        roundAvatar
        hideChevron
        avatar={Images.userAvatar}
        avatarContainerStyle={{ alignSelf: "flex-start" }}
        avatarStyle={{ width: 40, height: 40, borderRadius: 20 }}
        title={
          <View style={{ marginHorizontal: 10, flexDirection: "column" }}>
            <Text style={{ fontSize: moderateScale(14, 1.2), fontWeight: "bold", color: Colors.OLD_LITE_BLUE }}>{item.FullName}</Text>
            <Text style={{ fontSize: moderateScale(11, 1.1), color: Colors.DANK_GRAY }}>{convertDateTimeToString(item.NGAYTAO, true)}</Text>
          </View>
        }
        subtitle={
          <View style={{ marginTop: 8, marginHorizontal: 10 }}>
            <Text style={{ fontSize: moderateScale(12, 1.2) }}>{item.NOIDUNG}</Text>
          </View>
        }
        containerStyle={{
          marginBottom: 10,
          borderBottomWidth: .7,
          marginHorizontal: 7,
        }}
      />
    )
  }

  render() {
    let attachmentContent = null;
    let attach = this.state.comment.ATTACH;
    if (attach != null) {
      attachmentContent = (
        <View style={AttachCommentStyle.commentAttachContainer}>
          <View style={AttachCommentStyle.commentAttachInfo}>
            <RneIcon name='ios-attach' color={Colors.BLUE_PANTONE_640C} size={verticalScale(20)} type='ionicon' />
            <Text style={AttachCommentStyle.commentAttachText}>
              {formatLongText(this.state.comment.ATTACH.TENTAILIEU, 30)}
            </Text>
          </View>

          <TouchableOpacity style={AttachCommentStyle.commetnAttachButton} onPress={() => this.onDownloadFile(attach.TENTAILIEU, attach.DUONGDAN_FILE, attach.DINHDANG_FILE)}>
            <RneIcon name='download' color={Colors.BLUE_PANTONE_640C} size={verticalScale(15)} type='entypo' />
          </TouchableOpacity>
        </View>
      )
    }
    const buttonSendColor = this.state.commentContent.trim() === EMPTY_STRING ? Colors.GRAY : Colors.LITE_BLUE;
    return (
      <Container>
        <Header style={NativeBaseStyle.container}>
          <Left style={NativeBaseStyle.left}>
            <GoBackButton onPress={() => this.navigateToListComment()} />
          </Left>

          <Body style={NativeBaseStyle.body}>
            <Title style={NativeBaseStyle.bodyTitle}>
              TRẢ LỜI
          </Title>
          </Body>

          <Right style={NativeBaseStyle.right} />
        </Header>

        <View style={ReplyCommentStyle.replyCommentContainer}>
          <ListItem
            roundAvatar
            hideChevron
            avatar={Images.userAvatar}
            avatarContainerStyle={{ alignSelf: "flex-start" }}
            avatarStyle={{ width: 50, height: 50, borderRadius: 25 }}
            title={
              <View style={{ marginHorizontal: 10, flexDirection: "column" }}>
                <Text style={{ fontSize: moderateScale(15, 1.2), fontWeight: "bold", color: Colors.LITE_BLUE }}>{this.state.comment.FullName}</Text>
                <Text style={{ fontSize: moderateScale(12, 1.1), color: Colors.DANK_GRAY }}>{convertDateTimeToString(this.state.comment.NGAYTAO, true)}</Text>
              </View>
            }
            containerStyle={{
              borderBottomWidth: 0
            }}
          />
          {
            // <View style={ReplyCommentStyle.replyObjectContainer}>
            //   <View style={ReplyCommentStyle.replyObjectHeader}>

            //     <View style={ReplyCommentStyle.replyObjectAvatarContainer}>
            //       <View style={ReplyCommentStyle.replyObjectAvatar}>
            //         <RneIcon size={moderateScale(50)} type='ionicon' name='ios-people' color={Colors.WHITE} />
            //       </View>
            //     </View>

            //     <View style={ReplyCommentStyle.replyObjectUserContainer}>
            //       <Text style={ReplyCommentStyle.replyObjectUserText}>
            //         {this.state.comment.FullName}
            //       </Text>
            //     </View>
            //   </View>

            <View style={ReplyCommentStyle.replyObjectContent}>
              <Text style={ReplyCommentStyle.replyObjectContentText}>
                {this.state.comment.NOIDUNG}
              </Text>
            </View>

            //   {
            //     attachmentContent
            //   }

            //   <View style={ReplyCommentStyle.replyObjectTime}>
            //     <Text style={ReplyCommentStyle.replyObjectTimeText}>
            //       {convertDateTimeToString(this.state.comment.NGAYTAO)}
            //     </Text>
            //   </View>
            // </View>
          }
        </View>
        <Content contentContainerStyle={{ flex: 1 }}>
          <ScrollView>
            <View style={ReplyCommentStyle.replyListContainer}>
              {
                renderIf(this.state.loading)(
                  dataLoading(true)
                )
              }

              {
                renderIf(!this.state.loading)(
                  <FlatList
                    inverted
                    renderItem={this.renderItem}
                    data={this.state.data}
                    keyExtractor={(item, index) => index.toString()}
                    ListFooterComponent={() => (<MoreButton
                      isLoading={this.state.loadingMore}
                      isTrigger={this.state.data.length >= DEFAULT_PAGE_SIZE}
                      loadmoreFunc={this.loadingMore}
                    />)}
                  />
                )
              }
            </View>
          </ScrollView>
        </Content>

        <Footer style={[{ flex: this.state.footerFlex, backgroundColor: Colors.WHITE, height: verticalScale(50) }, FooterCommentStyle.footerComment]}>
          <Input
            // style={{ paddingLeft: moderateScale(10) }}
            placeholder='Nhập nội dung phản hồi'
            value={this.state.commentContent}
            onChangeText={(commentContent) => this.setState({ commentContent })}
            multiline
          />
          <Button
            transparent
            onPress={this.sendComment}
            disabled={this.state.commentContent.trim() === EMPTY_STRING}
            style={{ marginVertical: 10 }}
          >
            <Text style={{ fontSize: moderateScale(20), color: buttonSendColor }}>GỬI</Text>
            {
              // <RneIcon name='md-send' size={moderateScale(40)} color={buttonSendColor} type='ionicon' />
            }
          </Button>
        </Footer>

        {
          executeLoading(this.state.executing)
        }
      </Container>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    userInfo: state.userState.userInfo,
    coreNavParams: state.navState.coreNavParams,
    extendsNavParams: state.navState.extendsNavParams,
  }
}

export default connect(mapStateToProps)(ReplyComment);