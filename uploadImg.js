		// 上传图片
		// $('#btnImg').off("click").on("click", function(e){
		// 	e.stopPropagation();
		// 	$("#iptUploadImg").click();
		// });
		
		// $("#iptUploadImg").on("change",function(e){
		// 	var fileList = e.target.files || e.dataTransfer.files;
        //     var filesName = [];
        //     for (let i = 0; i < fileList.length; i++) {
        //         var file = fileList[i];
        //         if (file.size > 500000) {
        //             alert("图片或者文件太大")
        //             return;
        //         };
                
		// 		var reader = new FileReader();
		// 		reader.readAsBinaryString(file);
		// 		reader.onloadend = function(evt){
		// 			var result = evt.target.result;
					
		// 			imgMsg.content = "data:image/jpeg;base64,"+ArrayBufferUtils.toBase64(result);
		// 			UI.showMsg(imgMsg, myData.userId, 1, 1, "newMsg");
					
		// 			var chainKey = RoomChatInstance.genFileMsgChainKey();
		// 			var encryptArray = RoomChatInstance.encryptFileMsg(result, chainKey);
		// 			// var encrytResult = "data:image/jpeg;base64," + ArrayBufferUtils.toBase64(encryptArray);
		// 			var aafile = new File(encryptArray, file.name);
		// 			imgMsg.fileChainKey = ArrayBufferUtils.toBase64(chainKey);
		// 			obj.resetFile(index, aafile, file.name);
		// 			DataUtils.saveMessage(imgMsg); //储存消息
		// 			var formData = new FormData();
		// 			formData.append('file', aafile);
		// 			myFn.invoke({
		// 				url: AppConfig.uploadServer + '/upload/UploadServlet',
		// 				data: formData,
		// 				cache: false,
		// 				success: function (res) {
		// 					debugger
		// 					if(res && res.data && res.data.images) {
		// 						imgMsg.content = res.data.images[0].oUrl;
		// 					}
		// 				},
						
		// 				error: function (data) {
		// 					console.log(data);
		// 				}
		// 			});
		// 		}

		// 		reader.onerror = function () {
		// 			alert('upload failed');
		// 		}
             
        //     }
		// })