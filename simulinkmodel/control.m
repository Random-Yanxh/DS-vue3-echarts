%% ========================================================================
% 脚本功能: 自动运行Simulink模型并处理仿真结果
% 1. 运行 'Microgrid_PV_WG_Bat_EV_j.slx' 模型.
% 2. 提取7个日志结构体中的 P, Q, Va, Ia 字段.
% 3. 将每个字段的数据与时间结合，生成JSON文件.
% 4. 将所有JSON文件保存在 'data_json' 子文件夹中.
% =========================================================================

clear; clc;
fprintf('脚本开始运行...\n');

%% --- 1. 参数定义 ---
% 模型名称 (无需 .slx 后缀)
modelName = 'Microgrid_PV_WG_Bat_EV_j';

% 需要处理的日志结构体名称列表
logNames = {'BatteryLog', 'EVLog', 'GridLog', 'LoadLog', 'PELLog', 'PVLog', 'WindLog'};
% 需要从每个结构体中提取的字段名称列表
fieldsToExtract = {'P', 'Q', 'Va', 'Ia'};

% JSON输出文件夹名称
outputFolder = 'data_json';

%% --- 2. 检查并运行Simulink模型 ---
% 检查模型文件是否存在于当前路径
if ~isfile([modelName, '.slx'])
    error('指定的Simulink模型文件 "%s.slx" 不在当前路径下，请检查文件位置。', modelName);
end

% 创建输出文件夹（如果它不存在）
if ~exist(outputFolder, 'dir')
    mkdir(outputFolder);
    fprintf('已创建输出文件夹: %s\n', outputFolder);
end

% 运行仿真，并使用 try-catch 捕获可能发生的错误
fprintf('正在运行Simulink仿真: %s.slx ...\n', modelName);
try
    % 使用 sim 命令运行模型。仿真结束后，数据会自动加载到基础工作区。
    sim(modelName); 
    fprintf('仿真成功完成。\n');
catch ME
    % 如果仿真失败，显示错误信息并终止脚本
    error('Simulink模型运行失败: %s', ME.message);
end

%% --- 3. 处理数据并生成JSON文件 ---
fprintf('开始处理仿真数据并生成JSON文件...\n');
totalFilesCreated = 0;

% 外层循环：遍历每一个日志结构体的名称
for i = 1:length(logNames)
    logName = logNames{i};
    
    % 检查对应的结构体是否在基础工作区中存在
    % evalin 用于在指定工作区执行表达式
    if ~evalin('base', ['exist(''', logName, ''', ''var'')'])
        warning('警告: 未在工作区中找到日志: %s。将跳过对此日志的处理。', logName);
        continue; % 跳过当前循环，继续处理下一个日志
    end
    
    % 从基础工作区获取日志结构体
    logData = evalin('base', logName);
    
    % 检查并提取时间向量
    if ~isfield(logData, 'time')
        warning('警告: 在 %s 中未找到 "time" 字段。将跳过对此日志的处理。', logName);
        continue;
    end
    timeVector = logData.time;
    
    % 内层循环：遍历需要提取的每一个字段 (P, Q, Va, Ia)
    for j = 1:length(fieldsToExtract)
        fieldName = fieldsToExtract{j};
        
        % 检查字段是否存在于当前日志结构体中
        if ~isfield(logData, fieldName)
            warning('警告: 在 %s 中未找到字段: %s。将跳过此字段。', logName, fieldName);
            continue;
        end
        
        % 提取数据向量 (例如 P, Q, Va, Ia)
        dataVector = logData.(fieldName);
        
        % 检查时间和数据向量的长度是否一致
        if length(timeVector) ~= length(dataVector)
            warning('警告: 在 %s 中，"time" 和 "%s" 的数据点数量不匹配。将跳过此字段。', logName, fieldName);
            continue;
        end
        
        % 将时间和数据组合成一个用于JSON编码的结构体数组
        % 这是生成 [{"time": t1, "value": v1}, ...] 格式的关键步骤
        % num2cell将数组转换为元胞数组，以便struct函数可以逐点配对
        outputStruct = struct('time', num2cell(timeVector), 'value', num2cell(dataVector));
        
        % 使用jsonencode转换为JSON格式的文本
        % "PrettyPrint"选项使JSON文件格式化，带缩进，易于人工阅读
        jsonText = jsonencode(outputStruct, "PrettyPrint", true);
        
        % 构建输出文件名和包含文件夹的完整路径
        outputFileName = sprintf('%s_%s.json', logName, fieldName);
        fullFilePath = fullfile(outputFolder, outputFileName);
        
        % 将JSON文本写入文件
        try
            fileID = fopen(fullFilePath, 'w', 'n', 'UTF-8'); % 使用UTF-8编码
            fprintf(fileID, '%s', jsonText);
            fclose(fileID);
            totalFilesCreated = totalFilesCreated + 1;
        catch writeME
            warning('无法写入文件 %s: %s', fullFilePath, writeME.message);
        end
    end
end

fprintf('--------------------------------------------------\n');
fprintf('处理完成！总共成功创建了 %d 个JSON文件。\n', totalFilesCreated);
fprintf('所有文件已保存在当前路径下的 "%s" 文件夹中。\n', outputFolder);
