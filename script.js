// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('c', {
  selection: true,
});

// Function to resize canvas to fit window
function resizeCanvas() {
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);
  canvas.renderAll();
}

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Initial resize to fit window
resizeCanvas();

// Variables to keep track of the current action
let isDrawingLine = false;
let line;

// Event Handlers for Buttons
document.getElementById('add-block-btn').addEventListener('click', addBlock);
document.getElementById('add-input-port-btn').addEventListener('click', () => addPort('input'));
document.getElementById('add-output-port-btn').addEventListener('click', () => addPort('output'));
document.getElementById('add-line-btn').addEventListener('click', () => {
  isDrawingLine = true;
  canvas.defaultCursor = 'crosshair';
  canvas.discardActiveObject();
});
document.getElementById('delete-btn').addEventListener('click', deleteSelected);

// Function to add a block
function addBlock() {
  const color = prompt('Enter block color:', 'blue') || 'blue';
  const width = parseInt(prompt('Enter block width:', '100')) || 100;
  const height = parseInt(prompt('Enter block height:', '60')) || 60;
  const textContent = prompt('Enter block text:', 'Block') || 'Block';

  const block = new fabric.Rect({
    fill: color,
    width: width,
    height: height,
    originX: 'center',
    originY: 'center',
  });

  const text = new fabric.Textbox(textContent, {
    fontSize: 16,
    fill: '#fff',
    originX: 'center',
    originY: 'center',
    editable: true,
  });

  const group = new fabric.Group([block, text], {
    left: 100,
    top: 100,
    hasControls: true,
    lockScalingFlip: true,
  });

  group.objectType = 'block'; // Custom property to identify blocks

  group.ports = []; // Array to hold associated ports

  canvas.add(group);

  // Allow editing text after placement
  text.on('editing:entered', () => {
    group.lockMovementX = group.lockMovementY = true;
  });
  text.on('editing:exited', () => {
    group.lockMovementX = group.lockMovementY = false;
  });

  // Update ports when block is moved
  group.on('moving', updatePortsPosition);
}

// Function to add a port to a block
function addPort(portType) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject || activeObject.objectType !== 'block') {
    alert('Please select a block first.');
    return;
  }

  const portLabel = prompt('Enter port label:', portType === 'input' ? 'Input' : 'Output') || (portType === 'input' ? 'Input' : 'Output');
  const portSize = parseInt(prompt('Enter port size:', '10')) || 10;

  // Set color based on port type
  const portColor = portType === 'input' ? 'red' : 'green';

  const port = new fabric.Rect({
    width: portSize,
    height: portSize,
    fill: portColor,
    originX: 'center',
    originY: 'center',
  });

  const label = new fabric.Textbox(portLabel, {
    fontSize: 12,
    fill: 'black',
    originX: 'center',
    originY: 'center',
    top: port.top + portSize,
    editable: true,
  });

  const portGroup = new fabric.Group([port, label], {
    hasControls: true,
  });

  // Calculate position to bind port to edge of block
  const block = activeObject.item(0);
  const blockWidth = block.width * block.scaleX;
  const blockHeight = block.height * block.scaleY;

  portGroup.left = activeObject.left + (portType === 'input' ? -blockWidth / 2 - portSize / 2 : blockWidth / 2 + portSize / 2);
  portGroup.top = activeObject.top;

  portGroup.objectType = 'port'; // Custom property to identify ports

  canvas.add(portGroup);

  // Add the port to the block's ports array
  activeObject.ports.push(portGroup);

  // Allow editing text after placement
  label.on('editing:entered', () => {
    portGroup.lockMovementX = portGroup.lockMovementY = true;
  });
  label.on('editing:exited', () => {
    portGroup.lockMovementX = portGroup.lockMovementY = false;
  });

  canvas.renderAll();
}

// Function to update ports position when block is moved
function updatePortsPosition() {
  const activeObject = this;
  activeObject.ports.forEach(portGroup => {
    const block = activeObject.item(0);
    const blockWidth = block.width * block.scaleX;

    portGroup.left = activeObject.left + (portGroup.item(0).fill === 'red' ? -blockWidth / 2 - portGroup.width / 2 : blockWidth / 2 + portGroup.width / 2);
    portGroup.top = activeObject.top;
    portGroup.setCoords();
  });
}

// Remove block highlight on mouse up
canvas.on('mouse:up', function () {
  canvas.forEachObject(function (obj) {
    if (obj.objectType === 'block') {
      const blockRect = obj.item(0);
      if (blockRect && typeof blockRect.set === 'function') {
        blockRect.set('stroke', null);
      }
    }
  });
  canvas.renderAll();
});

// Mouse event handlers for drawing lines
canvas.on('mouse:down', function (opt) {
  if (isDrawingLine) {
    const pointer = canvas.getPointer(opt.e);
    const points = [pointer.x, pointer.y, pointer.x, pointer.y];

    line = new fabric.Line(points, {
      stroke: 'black',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(line);
  } else if (!opt.target) {
    // Deselect objects when clicking on empty space
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }
});

canvas.on('mouse:move', function (opt) {
  if (!isDrawingLine) return;
  const pointer = canvas.getPointer(opt.e);
  line.set({ x2: pointer.x, y2: pointer.y });
  canvas.renderAll();
});

canvas.on('mouse:up', function () {
  if (isDrawingLine) {
    isDrawingLine = false;
    canvas.defaultCursor = 'default';

    // Make the line selectable and movable
    line.set({
      selectable: true,
      evented: true,
    });

    // Add event listeners to the line for movement
    line.on('selected', function () {
      line.set({
        strokeDashArray: [5, 5], // Visual feedback when selected
      });
    });

    line.on('deselected', function () {
      line.set({
        strokeDashArray: null,
      });
    });

    canvas.renderAll();
  }
});

// Delete selected object
function deleteSelected() {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
    canvas.renderAll();
  }
}
