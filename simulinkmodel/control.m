%% ========================================================================
% 脚本功能: (修改版) 不重新仿真，直接处理工作区中的数据并生成JSON
% 1. (已跳过) 运行 'Microgrid_PV_WG_Bat_EV_j.slx' 模型.
% 2. 从工作区提取7个日志结构体中的 P, Q, Va, Ia 字段.
% 3. 对数据进行精度控制 (时间5位小数,数值3位小数).
% 4. 将每个字段的数据与时间结合，生成JSON文件.
% 5. 将所有JSON文件保存在 'data_json' 子文件夹中.
% =========================================================================

% 注意：下面的 'clear' 已被注释掉，以保留工作区中的现有数据
% clear; 
clc;
fprintf('脚本开始运行 ...\n');

%% --- 1. 参数定义 ---
% 日志结构体名称列表 (与之前保持一致)
logNames = {'BatteryLog', 'EVLog', 'GridLog', 'LoadLog', 'PELLog', 'PVLog', 'WindLog'};

% 需要从每个结构体中提取的字段名称列表 (与之前保持一致)
fieldsToExtract = {'P', 'Q', 'Va', 'Ia'};

% JSON输出文件夹名称
outputFolder = 'data_json';

%% --- 2. 运行Simulink模型 ---
% 下面的仿真命令已被注释掉，因为我们直接使用工作区中已有的数据
% fprintf('正在运行Simulink仿真...\n');
% sim('Microgrid_PV_WG_Bat_EV_j'); 
% fprintf('仿真完成。\n');

% 检查输出文件夹是否存在，如果不存在则创建
if ~exist(outputFolder, 'dir')
    mkdir(outputFolder);
    fprintf('已创建输出文件夹: %s\n', outputFolder);
end

%% --- 3. 处理数据并生成JSON文件 ---
fprintf('开始从工作区处理数据并生成JSON文件...\n');
totalFilesCreated = 0;

% 外层循环：遍历每一个日志结构体的名称
for i = 1:length(logNames)
    logName = logNames{i};
    
    % 检查对应的结构体是否在基础工作区中存在
    if ~evalin('base', ['exist(''', logName, ''', ''var'')'])
        warning('警告: 未在工作区中找到日志: %s。将跳过对此日志的处理。', logName);
        continue;
    end
    
    % 从基础工作区获取日志结构体
    logData = evalin('base', logName);
    
    % 检查并提取时间向量
    if ~isfield(logData, 'time')
        warning('警告: 在 %s 中未找到 "time" 字段。将跳过对此日志的处理。', logName);
        continue;
    end
    
    % ==================== MODIFICATION START ====================
    % V2.0: 对时间数据进行精度控制，保留5位小数
    timeVector = round(logData.time, 5);
    % ===================== MODIFICATION END =====================

    % 内层循环：遍历需要提取的每一个字段 (P, Q, Va, Ia)
    for j = 1:length(fieldsToExtract)
        fieldName = fieldsToExtract{j};
        
        if ~isfield(logData, fieldName)
            warning('警告: 在 %s 中未找到字段: %s。将跳过此字段。', logName, fieldName);
            continue;
        end
        
        % ==================== MODIFICATION START ====================
        % V2.0: 对数值数据进行精度控制，保留3位小数
        dataVector = round(logData.(fieldName), 3);
        % ===================== MODIFICATION END =====================

        if length(timeVector) ~= length(dataVector)
            warning('警告: 在 %s 中，"time" 和 "%s" 的数据点数量不匹配。将跳过此字段。', logName, fieldName);
            continue;
        end
        
        outputStruct = struct('time', num2cell(timeVector), 'value', num2cell(dataVector));
        jsonText = jsonencode(outputStruct, "PrettyPrint", true);
        
        outputFileName = sprintf('%s_%s.json', logName, fieldName);
        fullFilePath = fullfile(outputFolder, outputFileName);
        
        try
            fileID = fopen(fullFilePath, 'w', 'n', 'UTF-8');
            fprintf(fileID, '%s', jsonText);
            fclose(fileID);
            totalFilesCreated = totalFilesCreated + 1;
        catch writeME
            warning('无法写入文件 %s: %s', fullFilePath, writeME.message);
        end
    end
end

fprintf('--------------------------------------------------\n');
fprintf('处理完成！总共成功创建/覆盖了 %d 个JSON文件。\n', totalFilesCreated);
fprintf('所有文件已保存在当前路径下的 "%s" 文件夹中。\n', outputFolder);
