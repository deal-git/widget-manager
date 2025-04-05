import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import WidgetManager from './lib.js';

const dom = new JSDOM(`<!doctype html>
<html>
    <head></head>
    <body>
        <div id="widgets-root">
            <div id="nodeWithoutWidget"></div>
            <div widget="SomeWidget" id="nodeWithWidget"></div>
            <div id="nodeWithoutWidgetWithChild">
                <div widget="TenthWidget"></div>
            </div>
            <div widget="FirstWidget" id="nodeWithWidgetWithChild">
                <div widget="SecondWidget"></div>
            </div>
            <div id="nodeWithWidgetWithChildren" widget="EleventhWidget">
                <div widget="TwelvethWidget"></div>
                <div widget="ThirteenthWidget"></div>
            </div>
            <div widget="SomeOtherWidget" id="otherNodeWithWidget"></div>
            <div></div>
            <div widget="ThirdWidget" id="nodeWithThirdWidget"></div>
            <div widget="ForthWidget" id="nodeWithWidgetTree">
                <div>
                    <div widget="FifthWidget" id="nodeWithWidgetWithChildWidget">
                        <div widget="SixthWidget" id="sixthNode"></div>
                    </div>
                    <div widget="SeventhWidget" id="seventhNode"></div>
                </div>
            </div>
        </div>
    </body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window;

let mockNodeWithoutWidget = document.getElementById('nodeWithoutWidget');
let mockNodeWithWidget = document.getElementById('nodeWithWidget');
let mockNodeWithChildNode = document.getElementById('nodeWithoutWidgetWithChild');
let mockNodeWithWidgetWithChildNode = document.getElementById('nodeWithWidgetWithChild');
let mockNodeWithWidgetWithChildNodes = document.getElementById('nodeWithWidgetWithChildren');
let mockOtherNodeWithWidget = document.getElementById('otherNodeWithWidget');
let mockNodeWithThirdWidget = document.getElementById('nodeWithThirdWidget');
let mockNodeWithWidgetTree = document.getElementById('nodeWithWidgetTree');
let mockNodeWithWidgetWithChildWidget = document.getElementById('nodeWithWidgetWithChildWidget');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeFuncForSubtree(node, cb) {
    if (node && cb) {
        await cb(node);
    }

    if (node.children && node.children.length > 0) {
        for (let child of node.children) {
            await executeFuncForSubtree(child, cb);
        }
    }
}

const destroyError = new Error('Widget destroy error');

let widgetManager;

class TestWidget {
    constructor() {
        this.status = null;
        this.node = null;
        this.callback = null;
    }

    init(node, callback) {
        if (this.status) {
            return false;
        }
        this.node = node;
        this.callback = callback;
        node.widgetInstance = this;
        this.status = 'initializing';
    }

    destroy() {
        if (['initializing'].includes(this.status)) {
            this.callback(destroyError);
        }
        this.status = null;
        this.callback = null;
        this.node.widgetInstance = null;
    }

    done() {
        if (this.status !== 'initializing') {
            return false;
        }
        this.status = 'initialized';
        this.callback();
        return true;
    }

    fail(err) {
        this.status = 'failed';
        this.callback(err);
    }
}

describe('WidgetManager', () => {
    let initWidgetCallback;
    let callback;

    beforeEach(() => {
        callback = jest.fn();

        TestWidget.prototype.init = jest.fn(TestWidget.prototype.init);

        initWidgetCallback = jest.fn((node) => {
            console.log('initWidgetCallback', node);
        });

        widgetManager = new WidgetManager({
            resolver: 'test',
            testWidget: TestWidget,
            initWidgetCallback,
        });
    });

    describe('test various cases of init and destroy calls', () => {
        it('initialize single node without widget attribute', async () => {
            await widgetManager.init(mockNodeWithoutWidget, callback);
            expect(callback).toHaveBeenCalledWith(0, null);
        });

        it('initialize single node with widget attribute', async () => {
            widgetManager.init(mockNodeWithWidget, callback);

            await delay(100);
            mockNodeWithWidget.widgetInstance.done();
            await delay(100);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidget);
            expect(callback).toHaveBeenCalledWith(1, null);
        });

        it('destroy single node with widget', async () => {
            const widgetInstance = mockNodeWithWidget.widgetInstance;
            const destroySpy = jest.spyOn(widgetInstance, 'destroy');
            expect(mockNodeWithWidget.widgetInstance).not.toBe(undefined);
            widgetManager.destroy(mockNodeWithWidget);
            expect(destroySpy).toHaveBeenCalled();
            expect(mockNodeWithWidget.widgetInstance).toBe(null);
        });

        it('initialize single node with widget attribute twice', async () => {
            widgetManager.destroy(mockNodeWithWidget);
            widgetManager.init(mockNodeWithWidget, callback);
            widgetManager.init(mockNodeWithWidget, callback);
            await delay(100);
            mockNodeWithWidget.widgetInstance.done();
            mockNodeWithWidget.widgetInstance.done();
            await delay(100);
            const initSpy = jest.spyOn(TestWidget.prototype, 'init');
            expect(initSpy).toHaveBeenCalledTimes(1);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidget);
            expect(callback).toHaveBeenCalledWith(1, null);
        });

        it('initialize node with child with widget attribute', async () => {
            widgetManager.init(mockNodeWithChildNode, callback);
            const childNode = mockNodeWithChildNode.children[0];
            await delay(100);
            childNode.widgetInstance.done();
            await delay(100);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(childNode);
            expect(callback).toHaveBeenCalledWith(1, null);
        });

        it('initialize node with widget attribute and with child with widget attribute', async () => {
            widgetManager.init(mockNodeWithWidgetWithChildNode, callback);
            const childNode = mockNodeWithWidgetWithChildNode.children[0];
            await delay(100);
            mockNodeWithWidgetWithChildNode.widgetInstance.done();
            await delay(100);
            childNode.widgetInstance.done();
            await delay(100);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidgetWithChildNode);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(childNode);
            expect(callback).toHaveBeenCalledWith(2, null);
        });

        it('initialize node with widget attribute and with 2 child nodes with widget attribute', async () => {
            widgetManager.init(mockNodeWithWidgetWithChildNodes, callback);
            const children = mockNodeWithWidgetWithChildNodes.children;
            await delay(100);
            mockNodeWithWidgetWithChildNodes.widgetInstance.done();
            await delay(100);
            for (const childNode of children) {
                childNode.widgetInstance.done();
                await delay(100);
            }
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidgetWithChildNodes);
            Array.from(children).forEach((childNode) => expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(childNode));
            expect(callback).toHaveBeenCalledWith(3, null);
        });

        it('error during widget initialization for single node', async () => {
            const err = new Error('Widget load error');
            widgetManager.init(mockOtherNodeWithWidget, callback);
            await delay(100);
            mockOtherNodeWithWidget.widgetInstance.fail(err);
            await delay(100);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockOtherNodeWithWidget);
            expect(callback).toHaveBeenCalledWith(0, [err]);
        });

        it('error during widget initialization for single node when destroy was called', async () => {
            widgetManager.init(mockNodeWithThirdWidget, callback);
            await delay(100);
            mockNodeWithThirdWidget.widgetInstance.destroy();
            await delay(100);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithThirdWidget);
            expect(callback).toHaveBeenCalledWith(0, [destroyError]);
        });

        it('run initialization for widgets node tree when some internal widget is already in initializing state', async () => {
            widgetManager.init(mockNodeWithWidgetWithChildWidget, callback);
            await delay(100);

            widgetManager.init(mockNodeWithWidgetTree, callback);
            await delay(100);

            await executeFuncForSubtree(mockNodeWithWidgetTree, async (node) => {
                if (node.widgetInstance && typeof node.widgetInstance.done === 'function') {
                    node.widgetInstance.done();
                    await delay(100);
                }
            });

            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidgetWithChildWidget);
            executeFuncForSubtree(mockNodeWithWidgetTree, (node) => {
                if (node.widgetInstance && node !== mockNodeWithWidgetWithChildWidget) {
                    expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(node);
                }
            });
            expect(callback).toHaveBeenCalledWith(2, null);
            expect(callback).toHaveBeenCalledWith(2, null);
        });

        it('run initialization for widgets node tree when some internal widget is already in initializing state #2', async () => {
            widgetManager.destroy(mockNodeWithWidgetTree);
            await delay(100);
            widgetManager.init(mockNodeWithWidgetTree, callback);
            await delay(100);

            widgetManager.init(mockNodeWithWidgetWithChildWidget, callback);
            await delay(100);
            
            await executeFuncForSubtree(mockNodeWithWidgetTree, async (node) => {
                if (node.widgetInstance && typeof node.widgetInstance.done === 'function') {
                    console.log('done', node.getAttribute('widget'));
                    node.widgetInstance.done();
                    await delay(100);
                }
            });
            
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidgetTree);
            expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(mockNodeWithWidgetWithChildWidget);
            executeFuncForSubtree(mockNodeWithWidgetTree, (node) => {
                if (node.widgetInstance && node !== mockNodeWithWidgetWithChildWidget && node !== mockNodeWithWidgetTree) {
                    expect(widgetManager['initWidgetCallback']).toHaveBeenCalledWith(node);
                }
            });
            expect(callback).toHaveBeenCalledWith(2, null);
            expect(callback).toHaveBeenCalledWith(2, null);
        });
    });
});
