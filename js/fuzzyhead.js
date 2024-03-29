$(document).ready(function() {
	$("#header").load("header.html");
	var spinner = $('#spinner');
	var fuzzingResult=$("#result");
	var stop=$("#stop");
	
	//Create task page
	if ($('body').hasClass('index')){
		hideSpinner();
		var fuzzer=$("select[name='fuzzer']");
		var target_ip=$("input[name='target_ip']");
		var cli_args=$("input[name='cli_args']");
		var cli_args_ro=$("#cli_args_ro");
		createCli();
		$("select[name='fuzzer'], input[name='target_ip']").on('input', function(){
			console.log()
			createCli();
		});
		$('form').submit(function(e) {
			fuzzingResult.empty();
			showSpinner();
			var formData=new FormData($('form')[0]);
			formData.set('cli_args', cli_args.val()+' '+cli_args_ro.text())
			//formData.cli_args_full=cli_args.val()+' '+cli_args_ro.text()
			//console.log(formData)
			$.ajax({
				async: true,
		        type: "POST",
		        url: "/", 
		        data: formData, 
		        cache: false,
			    contentType: false,
			    processData: false,
		        success: function(data){
		        	var result = JSON.parse(data);
		        	showResult(statsTemplate(result.match, result.hits, result.done, result.skip, 
		        		result.fail, result.size, result.avg, result.time));
		        },
		        error: function(err){
		        	showResult(`ajax err: ${JSON.stringify(err,null,2)}`);
		        }
	        });
	        e.preventDefault();
		}); 
		function createCli(){
			switch (fuzzer.val()){
				case "dirsearch":
					cli_args.val(`--url ${target_ip.val()} -e html`);
					cli_args_ro.text('--wordlist=wordlist.txt --simple-report=/dirsearch/result.txt');
					break;
				case "patator":
					cli_args.val(`ssh_login host=${target_ip.val()} user=victim -x ignore:mesg='Authentication failed.'`);
					cli_args_ro.text('password=FILE0 0=passwords.txt');
			}
		}

		function showResult(data){
			fuzzingResult.html(data);
			hideSpinner();
		}
	}
	//Task list page
	if ($('body').hasClass('list')){
		var taskList=$('#task_list tbody');
		getTaskList();
		$('#refresh').click(function(){
			getTaskList();
		});
		function getTaskList(){
			taskList.empty();
			$.ajax({
				async: true,
				type: "GET",
				url: "/getTaskList",
				data: {
					getDbData: true
				},
				success: function(data){
					var result = JSON.parse(data);
			        var htmlResult='';
			        for (var i=0; i<result.length; ++i){
			        	htmlResult+='<tr>';
			        	htmlResult+='<td>'+result[i].started_at+'</td>';
			        	htmlResult+='<td>'+result[i].name+'</td>';
			        	htmlResult+='<td>'+result[i].status+'</td>';
			        	htmlResult+="<td><a href=\"/getTaskDetails?id="+result[i].name+'_'+result[i].started_at+"&getDbData=false\" class=\"btn btn-default\">Details</a></td>";
			        	htmlResult+='</tr>';
			        }
					showResult(htmlResult);
					$("#task_list").dataTable({"bDestroy": true});
				},
				error: function(err){
					showResult(`ajax err: ${JSON.stringify(err,null,2)}`);
					
				}
			});
		}
		function showResult(data){
			taskList.html(data);
		}
	}
	//Task details page
	if ($('body').hasClass('details')){
		hideSpinner();
		var args=window.location.search;
		var taskId=args.slice(4, args.indexOf('&'));
		getTaskDetails();
		$('#refresh').click(function(){
			getTaskDetails();
		});
		$('#stop').click(function(){
			$.ajax({
				async: true,
				type: "GET",
				url: "/abortTask",
				data: {
					id: taskId
				},
				success: function(data){
					getTaskDetails();
				},
				error: function(err){
					showResult(`ajax err: ${JSON.stringify(err,null,2)}`);
				}
			});
		});

		function getTaskDetails(){
			fuzzingResult.empty();
			$.ajax({
				async: true,
				type: "GET",
				url: "/getTaskDetails",
				data: {
					id: taskId,
					getDbData: true
				},
				success: function(data){
					result=JSON.parse(data);
					$('#name').text(result.name);
					$('#started_at').text(result.started_at);
					$('#fuzzer').text(result.fuzzer);
					$('#target_ip').text(result.target_ip);
					$('#dict').text(result.dict);
					$('#divide_number').text(result.divide_number);
					$('#cli_args').text(result.cli_args);
					$('#rps').text(result.rps);
					var status=result.status;
					$('#status').text(status);
					switch (status)
					{
						case ('Running'):
							showSpinner();
							break;
						case ('Finished'):
							statsResult=JSON.parse(result.result);
						showResult(statsTemplate(statsResult.match, statsResult.hits, statsResult.done, statsResult.skip, 
			        		statsResult.fail, statsResult.size, statsResult.avg, statsResult.time));	
						case ('Aborted'):
						case ('Failed'):
							hideSpinner();
							break;
					}
					
				},
				error: function(err){
					showResult(`ajax err: ${JSON.stringify(err,null,2)}`);
				}
			});
		}
		function showResult(data){
			fuzzingResult.html(data);
		}
	}
	function showSpinner(){
		spinner.show();
		stop.show();
	}
	function hideSpinner(){
		spinner.hide();
		stop.hide();
	}
	function statsTemplate(match, hits, done, skip, fail, size, avg, time){
		return `<form class="form-horizontal">
		<div class="form-group">
			<label class="col-sm-2 control-label">Matches: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${match}</p>
			</div>
		</div>
		<div class="form-group">	
			<label class="col-sm-2 control-label">Hits: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${hits==undefined ? '' : hits}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Done: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${done==undefined ? '' : done}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Skip: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${skip==undefined ? '' : skip}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Fail: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${fail==undefined ? '' : fail}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Size: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${size==undefined ? '' : size}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Average requests/second: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${avg==undefined ? '' : avg}</p>
			</div>
		</div>
		<div class="form-group">
			<label class="col-sm-2 control-label">Fuzzing time: </label>
			<div class="col-sm-10">
				<p class="form-control-static">${time}</p>
			</div>
		</div>
		</form>`;
	}
});

