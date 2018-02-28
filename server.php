<?php
$dataPage = $_POST['dataPage'];
$dataRows = $_POST['dataRows'];

for($i=1; $i<=$dataRows; $i++){
    $data[] = array(
        'id' => $i,
        'text' => 'Page'.$dataPage.' - Row'.$i
    );
}

sleep(1);

echo json_encode($data);