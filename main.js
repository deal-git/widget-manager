    import WidgetManager from './lib.js';

    const widgetManager = new WidgetManager({
        initWidgetCallback: (node) => {
            setTimeout(() => {
                const autoSelectCheckbox = document.getElementById('autoSelectNextNode');
                if (autoSelectCheckbox?.checked) {
                    const selectedNodes = Array.from(document.querySelectorAll('.widget-initializing'));
                    if (selectedNodes.length) {
                        selectedNodes[0].click();
                    }
                }
            }, 50);
        }
    });
    
    let selectedNode = null;

    enableButtons(false);

    function getNodePath(node, topParent = document) {
        const nodes = [node];
        let checkNode = node;
        while (checkNode.parentNode && checkNode.parentNode !== topParent) {
            checkNode = checkNode.parentNode;
            nodes.unshift(checkNode);
        }
        return nodes.map((n) => {
            const id = n.id ? `#${n.id}` : `:nth-child(${Array.from(n.parentNode.children).indexOf(n) + 1})`;
            const widgetName = n.getAttribute('widget') || '';
            return `${n.tagName.toLowerCase()}${id}${widgetName ? ` (${widgetName})` : ''}`;
        }).join(' > ');
    }

    function enableButtons(enable) {
        document.getElementById('buttons').childNodes.forEach((element) => {
            if (element.tagName === 'BUTTON') {
                element.disabled = !enable;
            }
        });
    }

    document.body.addEventListener('click', (event) => {
        const target = event.target;
        if (target.closest('#buttons')) {
            return;
        }
        if (selectedNode) {
            selectedNode.classList.remove('selected');
            if (selectedNode === target || !target.closest('#widgets-root')) {
                selectedNode = null;
                document.getElementById('info').textContent = '';
                enableButtons(false);
                return;
            }
        }
        if (!target.closest('#widgets-root')) {
            return;
        }

        selectedNode = target.tagName.toLowerCase() === 'div' ? target : target.closest('div');
        selectedNode.classList.add('selected');

        document.getElementById('info').textContent = `Selected node: ${getNodePath(selectedNode, document.getElementById('widgets'))}`;
        enableButtons(true);
    });

    document.getElementById('init').addEventListener('click', () => {
        if (selectedNode) {
            const selNode = selectedNode;
            widgetManager.init(selNode, (initializedWidgetsCount, errors) => {
                console.log('Initialization callback for node (with its siblings):', selNode);
                if (errors) {
                    console.error('There were some initialization errors:', errors);
                } else if (initializedWidgetsCount) {
                    console.log(`Initialization was successful for ${initializedWidgetsCount} widgets`);
                } else {
                    console.log('Node without widget');
                }
            });
        }
    });

    document.getElementById('destroy').addEventListener('click', () => {
        if (selectedNode) {
            widgetManager.destroy(selectedNode);
        }
    });

    document.getElementById('done').addEventListener('click', () => {
        if (selectedNode && selectedNode.widgetInstance) {
            selectedNode.widgetInstance.done();
        }
    });

    document.getElementById('fail').addEventListener('click', () => {
        if (selectedNode && selectedNode.widgetInstance) {
            selectedNode.widgetInstance.fail();
        }
    });
